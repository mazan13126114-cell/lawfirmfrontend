<!-- src/views/CaseDetail.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const caseData = ref(null);
const loading = ref(true);
const user = ref(null);
const messages = ref([]);
const newMessage = ref('');
const messageLoading = ref(false);
const messageError = ref('');
const aiLoading = ref(false);
const aiAnalysis = ref('');

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(storedUser);
  getCaseDetails();
  fetchCaseMessages();
  
  // Auto-evaluate if no probability exists
  setTimeout(() => {
    if (caseData.value && !caseData.value.probabilityScore) {
      evaluateCaseSuccess();
    }
  }, 1000);
});

const getCaseDetails = () => {
  const token = localStorage.getItem('token');
  const caseId = route.params.id;

  fetch(`http://localhost:5000/api/cases/${caseId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        caseData.value = data.data.case;
      } else {
        router.push('/cases');
      }
      loading.value = false;
    })
    .catch((err) => {
      console.error('Failed to fetch case:', err);
      loading.value = false;
      router.push('/cases');
    });
};

const fetchCaseMessages = () => {
  const token = localStorage.getItem('token');
  const caseId = route.params.id;

  fetch(`http://localhost:5000/api/messages/case/${caseId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        messages.value = data.data.messages || [];
      }
    })
    .catch(err => {
      console.error('Failed to fetch messages:', err);
    });
};

const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  
  messageLoading.value = true;
  messageError.value = '';
  const token = localStorage.getItem('token');
  const caseId = route.params.id;
  
  let receiverId = null;
  if (user.value.role === 'client' && caseData.value.lawyer) {
    receiverId = caseData.value.lawyer.id;
  } else if (user.value.role === 'lawyer' && caseData.value.client) {
    receiverId = caseData.value.client.id;
  }
  
  if (!receiverId) {
    messageError.value = 'No recipient found';
    messageLoading.value = false;
    return;
  }

  fetch('http://localhost:5000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      receiverId,
      caseId,
      message: newMessage.value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        newMessage.value = '';
        fetchCaseMessages();
      } else {
        messageError.value = data.message || 'Failed to send message';
      }
      messageLoading.value = false;
    })
    .catch(err => {
      messageError.value = 'Failed to send message';
      messageLoading.value = false;
    });
};

// ✅ AI Case Evaluation
const evaluateCaseSuccess = () => {
  if (!caseData.value) return;
  
  aiLoading.value = true;
  const token = localStorage.getItem('token');
  
  fetch('http://localhost:5000/api/ai/predict-case', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      caseId: caseData.value.id,
      title: caseData.value.title,
      description: caseData.value.description,
      caseType: caseData.value.caseType
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        aiAnalysis.value = data.data.analysis;
        if (data.data.probability) {
          caseData.value.probabilityScore = data.data.probability;
        }
      }
    })
    .catch(err => {
      console.error('AI evaluation failed:', err);
    })
    .finally(() => {
      aiLoading.value = false;
    });
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    ongoing: 'bg-blue-100 text-blue-800',
    closed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const canMessage = computed(() => {
  if (!caseData.value) return false;
  
  if (user.value.role === 'client') {
    return caseData.value.lawyer?.id;
  }
  
  if (user.value.role === 'lawyer') {
    return caseData.value.client?.id;
  }
  
  return false;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading case details...</p>
      </div>

      <div v-else-if="caseData" class="space-y-6">
        <!-- Case Header -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ caseData.title }}</h1>
              <p class="text-sm text-gray-500 mt-1">Case #{{ caseData.caseNumber }}</p>
            </div>
            <span :class="getStatusClass(caseData.status)" class="px-4 py-2 rounded-full font-medium capitalize">
              {{ caseData.status }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <p class="text-sm text-gray-500">Case Type</p>
              <p class="text-lg font-semibold capitalize">{{ caseData.caseType }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Priority</p>
              <p class="text-lg font-semibold capitalize">{{ caseData.priority }}</p>
            </div>
            <!-- ✅ AI Success Probability -->
            <div>
              <p class="text-sm text-gray-500">Success Probability</p>
              <div class="flex items-center">
                <p v-if="caseData.probabilityScore" class="text-lg font-semibold text-green-600">
                  {{ caseData.probabilityScore }}%
                </p>
                <p v-else-if="aiLoading" class="text-lg text-gray-500">Analyzing...</p>
                <p v-else class="text-lg text-gray-500">Not evaluated</p>
                <button
                  @click="evaluateCaseSuccess"
                  :disabled="aiLoading"
                  class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                >
                  {{ aiLoading ? 'Analyzing...' : 'Evaluate' }}
                </button>
              </div>
              <div v-if="aiAnalysis" class="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {{ aiAnalysis }}
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <p class="text-gray-700 whitespace-pre-wrap">{{ caseData.description }}</p>
        </div>

        <!-- Parties -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Client</h2>
            <div v-if="caseData.client" class="space-y-2">
              <p><span class="font-medium">Name:</span> {{ caseData.client.name }}</p>
              <p><span class="font-medium">Email:</span> {{ caseData.client.email }}</p>
              <p v-if="caseData.client.phone"><span class="font-medium">Phone:</span> {{ caseData.client.phone }}</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Assigned Lawyer</h2>
            <div v-if="caseData.lawyer" class="space-y-2">
              <p><span class="font-medium">Name:</span> {{ caseData.lawyer.name }}</p>
              <p><span class="font-medium">Email:</span> {{ caseData.lawyer.email }}</p>
              <p v-if="caseData.lawyer.specialization">
                <span class="font-medium">Specialization:</span> {{ caseData.lawyer.specialization }}
              </p>
            </div>
            <div v-else class="text-gray-500">
              <p>No lawyer assigned yet</p>
            </div>
          </div>
        </div>

        <!-- Case Messages -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Case Messages</h2>
            <span class="text-sm text-gray-500">{{ messages.length }} messages</span>
          </div>

          <div class="h-64 overflow-y-auto border rounded p-3 mb-4 bg-gray-50">
            <div v-if="messages.length === 0" class="text-center text-gray-500 mt-20">
              No messages yet. Start a conversation about this case.
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="msg in messages" 
                :key="msg.id"
                class="p-2"
                :class="msg.senderId == user?.id ? 'text-right' : 'text-left'"
              >
                <div
                  class="inline-block px-3 py-1 rounded-lg max-w-xs"
                  :class="msg.senderId == user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
                >
                  {{ msg.message }}
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(msg.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div v-if="canMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Send a message about this case..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              @click="sendMessage"
              :disabled="messageLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {{ messageLoading ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-else class="text-gray-500 text-sm">
            {{ user.role === 'client' ? 'Lawyer must be assigned before messaging' : 'Client details available for messaging' }}
          </div>
          <div v-if="messageError" class="text-red-600 text-sm mt-2">{{ messageError }}</div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-lg shadow">
        <p class="text-gray-500">Case not found</p>
        <button @click="router.push('/cases')" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Cases
        </button>
      </div>
    </div>
  </div>
</template>
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
    pending: 'status-pending',
    assigned: 'status-pending',
    ongoing: 'status-ongoing',
    closed: 'status-closed',
    rejected: 'status-rejected'
  };
  return classes[status] || 'status-default';
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
  <div class="dashboard-container">
    <div class="container">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading case details...</p>
      </div>

      <div v-else-if="caseData" class="space-y-6">
        <!-- Case Header -->
        <div class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ caseData.title }}</h1>
              <p class="text-sm text-gray-500 mt-1">Case #{{ caseData.caseNumber }}</p>
            </div>
            <span :class="['status-badge', getStatusClass(caseData.status)]" class="px-4 py-2 rounded-full font-medium capitalize">
              {{ caseData.status }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-4 mt-6">
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
                  style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;"
                >
                  {{ aiLoading ? 'Analyzing...' : 'Evaluate' }}
                </button>
              </div>
              <div v-if="aiAnalysis" class="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded" style="background-color: #f9fafb; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; color: #4b5563;">
                {{ aiAnalysis }}
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="card">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <p class="text-gray-700" style="white-space: pre-wrap;">{{ caseData.description }}</p>
        </div>

        <!-- Parties -->
        <div class="grid grid-cols-1 sm-grid-cols-2 gap-6">
          <div class="card">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Client</h2>
            <div v-if="caseData.client" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <p><span class="font-medium">Name:</span> {{ caseData.client.name }}</p>
              <p><span class="font-medium">Email:</span> {{ caseData.client.email }}</p>
              <p v-if="caseData.client.phone"><span class="font-medium">Phone:</span> {{ caseData.client.phone }}</p>
            </div>
          </div>

          <div class="card">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Assigned Lawyer</h2>
            <div v-if="caseData.lawyer" style="display: flex; flex-direction: column; gap: 0.5rem;">
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
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Case Messages</h2>
            <span class="text-sm text-gray-500">{{ messages.length }} messages</span>
          </div>

          <div class="chat-container" style="height: 16rem;">
            <div v-if="messages.length === 0" class="chat-empty">
              No messages yet. Start a conversation about this case.
            </div>
            <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div 
                v-for="msg in messages" 
                :key="msg.id"
                style="padding: 0.5rem;"
                :class="msg.senderId == user?.id ? 'text-right' : 'text-left'"
              >
                <div
                  style="display: inline-block; padding: 0.5rem 0.75rem; border-radius: 0.75rem; max-width: 80%;"
                  :style="{ backgroundColor: msg.senderId == user?.id ? '#3b82f6' : '#f3f4f6', color: msg.senderId == user?.id ? 'white' : '#1f2937' }"
                >
                  {{ msg.message }}
                </div>
                <p class="text-xs text-gray-500 mt-1" style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">{{ formatDate(msg.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div v-if="canMessage" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Send a message about this case..."
              class="form-input"
              style="flex: 1; padding: 0.5rem; font-size: 0.875rem;"
            />
            <button
              @click="sendMessage"
              :disabled="messageLoading"
              class="btn btn-primary"
              style="padding: 0.5rem 1rem; font-size: 0.875rem;"
            >
              {{ messageLoading ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-else class="text-gray-500 text-sm" style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
            {{ user.role === 'client' ? 'Lawyer must be assigned before messaging' : 'Client details available for messaging' }}
          </div>
          <div v-if="messageError" class="text-red-600 text-sm mt-2" style="color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem;">{{ messageError }}</div>
        </div>
      </div>

      <div v-else class="text-center py-12" style="background-color: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 3rem 0;">
        <p class="text-gray-500">Case not found</p>
        <button @click="router.push('/cases')" class="btn btn-primary mt-4" style="margin-top: 1rem;">
          Back to Cases
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Grid system */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

.sm-grid-cols-2 {
  grid-template-columns: 1fr 1fr;
}

.lg-grid-cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

/* Flex utilities */
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

/* Spacing */
.mb-4 {
  margin-bottom: 1rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mt-6 {
  margin-top: 1.5rem;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

/* Typography */
.text-3xl {
  font-size: 1.875rem;
  font-weight: 700;
}

.text-xl {
  font-size: 1.25rem;
  font-weight: 700;
}

.text-lg {
  font-size: 1.125rem;
  font-weight: 600;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

.capitalize {
  text-transform: capitalize;
}

/* Colors */
.text-gray-500 {
  color: #6b7280;
}

.text-gray-600 {
  color: #4b5563;
}

.text-gray-700 {
  color: #374151;
}

.text-gray-900 {
  color: #111827;
}

.text-green-600 {
  color: #16a34a;
}

/* Status badge colors */
.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-ongoing {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-closed {
  background-color: #dcfce7;
  color: #166534;
}

.status-rejected {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-default {
  background-color: #f3f4f6;
  color: #4b5563;
}

/* Chat container */
.chat-container {
  height: 16rem;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  margin-bottom: 1rem;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
}

/* Responsive */
@media (max-width: 1024px) {
  .lg-grid-cols-3 {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .sm-grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .chat-container {
    height: 20rem;
  }
}
</style>
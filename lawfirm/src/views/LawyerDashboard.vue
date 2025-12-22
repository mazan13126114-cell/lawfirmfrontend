<!-- src/views/LawyerDashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const loading = ref(true);
const pendingRequests = ref([]);
const activeCases = ref([]);
const chatHistory = ref([]);
const chatInput = ref('');
const aiError = ref('');

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(storedUser);
  fetchPendingRequests();
  fetchActiveCases();
});

const fetchPendingRequests = () => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/cases/requests', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) pendingRequests.value = data.data.requests || [];
    })
    .catch(err => console.error('Failed to fetch requests:', err));
};

const fetchActiveCases = () => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/cases', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        activeCases.value = (data.data.cases || []).filter(c => ['assigned', 'ongoing'].includes(c.status));
      }
      loading.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch cases:', err);
      loading.value = false;
    });
};

// ✅ Start conversation with client
const startConversation = (clientId) => {
  router.push({
    path: '/messages',
    query: { to: clientId }
  });
};

const acceptRequest = (caseId) => {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/cases/${caseId}/assign`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        pendingRequests.value = pendingRequests.value.filter(r => r.id !== caseId);
        fetchActiveCases();
      }
    })
    .catch(err => console.error('Accept failed:', err));
};

const rejectRequest = (caseId) => {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/cases/${caseId}/reject`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        pendingRequests.value = pendingRequests.value.filter(r => r.id !== caseId);
      }
    })
    .catch(err => console.error('Reject failed:', err));
};

const viewCase = (caseId) => {
  router.push(`/cases/${caseId}`);
};

// AI Chat
const sendAIMessage = () => {
  const token = localStorage.getItem('token');
  const message = chatInput.value.trim();
  if (!message) return;

  chatHistory.value.push({ role: 'user', content: message });
  chatInput.value = '';
  aiError.value = '';

  fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        chatHistory.value.push({ role: 'assistant', content: data.data.message });
      } else {
        aiError.value = 'AI is unavailable right now.';
      }
    })
    .catch(err => {
      aiError.value = 'Failed to reach AI service.';
      console.error('AI error:', err);
    });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Welcome back, Lawyer {{ user?.name }}! 👨‍⚖️</h1>
        <p class="text-gray-600 mt-2">Review new case requests and manage your active cases.</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading your dashboard...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Requests & Cases -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Pending Requests -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold mb-4">📥 Pending Case Requests</h2>
            <div v-if="pendingRequests.length === 0" class="text-gray-500">
              No new case requests.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="req in pendingRequests" :key="req.id" class="border rounded-lg p-4">
                <div class="font-bold text-gray-900">{{ req.title }}</div>
                <p class="text-gray-600 text-sm mt-1">{{ req.description?.substring(0, 120) }}...</p>
                <div class="text-xs text-gray-500 mt-2">
                  Client: {{ req.client.name }} • {{ req.caseNumber }} • {{ formatDate(req.createdAt) }}
                </div>
                <div class="mt-3 flex space-x-2">
                  <button
                    @click="acceptRequest(req.id)"
                    class="px-4 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    @click="rejectRequest(req.id)"
                    class="px-4 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Reject
                  </button>
                  <button
                    @click="startConversation(req.clientId)"
                    class="px-4 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Message Client
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Active Cases -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold mb-4">📁 Active Cases</h2>
            <div v-if="activeCases.length === 0" class="text-gray-500">
              You have no active cases.
            </div>
            <ul v-else class="space-y-3">
              <li v-for="caseItem in activeCases" :key="caseItem.id" class="border rounded-lg p-4">
                <div class="flex justify-between">
                  <div class="font-bold text-gray-900">{{ caseItem.title }}</div>
                  <span class="px-2 py-1 text-xs rounded-full capitalize"
                    :class="caseItem.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                           caseItem.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                           'bg-gray-100 text-gray-800'">
                    {{ caseItem.status }}
                  </span>
                </div>
                <p class="text-gray-600 text-sm mt-1">{{ caseItem.description?.substring(0, 100) }}...</p>
                <div class="text-xs text-gray-500 mt-2">
                  Client: {{ caseItem.client.name }} • 
                  {{ caseItem.caseType }} case
                </div>
                <button
                  @click="viewCase(caseItem.id)"
                  class="mt-2 text-blue-600 text-sm hover:underline"
                >
                  View Details
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right: AI Chatbot -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold mb-4">🤖 AI Legal Assistant</h2>
          <div class="h-80 overflow-y-auto border rounded p-3 bg-gray-50 mb-3">
            <div v-if="chatHistory.length === 0" class="text-center text-gray-500 mt-20">
              <p>Analyze case strategy, draft responses, or research laws.</p>
            </div>
            <div v-for="(msg, index) in chatHistory" :key="index" class="mb-2">
              <div :class="msg.role === 'user' ? 'text-right' : 'text-left'">
                <div
                  class="inline-block px-3 py-1 rounded-lg max-w-xs"
                  :class="msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>
            <div v-if="aiError" class="text-red-600 text-sm mt-2">{{ aiError }}</div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="chatInput"
              @keyup.enter="sendAIMessage"
              type="text"
              placeholder="Ask about this case..."
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button
              @click="sendAIMessage"
              class="px-3 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Send
            </button>
          </div>
          <p class="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
            ⚠️ AI advice is for reference only. Use professional judgment.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
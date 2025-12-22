<!-- src/views/ClientDashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const loading = ref(true);
const lawyers = ref([]);
const cases = ref([]);
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
  fetchLawyers();
  fetchCases();
});

const fetchLawyers = () => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/lawyers', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) lawyers.value = data.data.users || [];
    })
    .catch(err => console.error('Failed to fetch lawyers:', err));
};

const fetchCases = () => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/cases', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) cases.value = data.data.cases || [];
      loading.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch cases:', err);
      loading.value = false;
    });
};

// ✅ Start conversation with lawyer
const startConversation = (lawyerId) => {
  router.push({
    path: '/messages',
    query: { to: lawyerId }
  });
};

const goToCases = () => {
  router.push('/cases');
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
        <h1 class="text-3xl font-bold text-gray-900">Welcome back, {{ user?.name }}! 👋</h1>
        <p class="text-gray-600 mt-2">Manage your cases and get AI legal help.</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading your dashboard...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Cases Section -->
        <div class="lg:col-span-2">
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">My Cases</h2>
              <router-link to="/cases" class="text-blue-600 hover:text-blue-700 font-medium">
                View All →
              </router-link>
            </div>
            
            <div v-if="cases.length === 0" class="text-center py-8">
              <div class="text-5xl mb-4">📋</div>
              <p class="text-gray-500">You haven't created any cases yet.</p>
            </div>
            
            <ul v-else class="space-y-4">
              <li v-for="caseItem in cases.slice(0, 3)" :key="caseItem.id" class="border-b pb-4 last:border-0 last:pb-0">
                <div class="flex justify-between">
                  <div class="font-bold text-gray-900">{{ caseItem.title }}</div>
                  <span class="px-2 py-1 text-xs rounded-full capitalize"
                    :class="caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                           caseItem.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                           caseItem.status === 'closed' ? 'bg-green-100 text-green-800' :
                           'bg-red-100 text-red-800'">
                    {{ caseItem.status }}
                  </span>
                </div>
                <p class="text-gray-600 text-sm mt-1">{{ caseItem.description?.substring(0, 100) }}...</p>
                <div class="text-xs text-gray-500 mt-2">
                  Lawyer: {{ caseItem.lawyer?.name || 'Not assigned' }} • 
                  {{ formatDate(caseItem.createdAt) }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- AI Chatbot -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold mb-4">🤖 AI Legal Assistant</h2>
          <div class="h-80 overflow-y-auto border rounded p-3 bg-gray-50 mb-3">
            <div v-if="chatHistory.length === 0" class="text-center text-gray-500 mt-20">
              <p>Ask about legal rights or case strategy!</p>
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
              placeholder="Ask a legal question..."
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
            ⚠️ AI advice is informational only.
          </p>
        </div>
      </div>

      <!-- Find Lawyers CTA -->
      <div v-if="!loading && cases.length === 0" class="mt-12 text-center">
        <div class="text-6xl mb-6">💼</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Get Started with LawConnect</h3>
        <p class="text-gray-600 max-w-2xl mx-auto mb-8">
          Create your first case and find the perfect lawyer for your legal needs.
        </p>
        <router-link
          to="/cases"
          class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg inline-block"
        >
          🚀 Find a Lawyer Now
        </router-link>
      </div>
    </div>
  </div>
</template>
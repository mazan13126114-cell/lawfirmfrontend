<!-- src/views/ClientDashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const loading = ref(true);
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
  fetchCases();
});

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

// ✅ Go to lawyers section in Cases
const goToLawyers = () => {
  router.push('/cases');
};

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
  <div class="dashboard-container">
    <div class="container">
      <div class="dashboard-header">
        <div class="flex items-center justify-between">
          <div>
            <h1>Welcome back, {{ user?.name }}! 👋</h1>
            <p>Manage your cases and get AI legal help.</p>
          </div>
          <router-link to="/profile" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
            Profile
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading your dashboard...</p>
      </div>

      <div v-else class="dashboard-grid">
        <div class="dashboard-main">
          <div class="card">
            <div class="card-header">
              <h2 class="text-xl font-bold">My Cases</h2>
              <router-link to="/cases" class="view-all-link">View All →</router-link>
            </div>
            
            <div v-if="cases.length === 0" class="empty-state">
              <div class="empty-icon">📋</div>
              <p>You haven't created any cases yet.</p>
            </div>
            
            <ul v-else>
              <li v-for="caseItem in cases.slice(0, 3)" :key="caseItem.id" class="mb-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <div class="flex justify-between">
                  <div class="font-bold text-gray-900">{{ caseItem.title }}</div>
                  <span class="status-badge" :class="`status-${caseItem.status}`">
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

          <!-- ✅ DEDICATED FIND LAWYER SECTION -->
          <div class="card" style="background: linear-gradient(135deg, #3b82f6, #7c3aed); border: none; color: white;">
            <div class="text-center">
              <h2 class="text-2xl font-bold mb-4">Need Legal Help?</h2>
              <p class="mb-6 opacity-90">
                Browse our network of qualified lawyers and find the perfect match for your case.
              </p>
              <button @click="goToLawyers" class="btn btn-primary" style="background-color: white; color: #3b82f6; font-weight: 600; padding: 0.75rem 2rem;">
                🧑‍💼 Find a Lawyer Now
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-bold mb-4">🤖 AI Legal Assistant</h2>
          <div class="chat-container">
            <div v-if="chatHistory.length === 0" class="chat-empty">
              <p>Ask about legal rights or case strategy!</p>
            </div>
            <div v-for="(msg, index) in chatHistory" :key="index" class="chat-message">
              <div :class="['chat-bubble', msg.role === 'user' ? 'chat-user' : 'chat-assistant']">
                {{ msg.content }}
              </div>
            </div>
            <div v-if="aiError" class="text-red-600 text-sm mt-2">{{ aiError }}</div>
          </div>
          <div class="chat-input-container">
            <input
              v-model="chatInput"
              @keyup.enter="sendAIMessage"
              type="text"
              placeholder="Ask a legal question..."
              class="chat-input"
            />
            <button @click="sendAIMessage" class="btn btn-primary chat-send-btn">Send</button>
          </div>
          <p class="ai-disclaimer">⚠️ AI advice is informational only.</p>
        </div>
      </div>

      <div v-if="!loading && cases.length === 0" class="text-center mt-12">
        <div class="empty-icon-large">💼</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Get Started with LawConnect</h3>
        <p class="text-gray-600 max-w-2xl mx-auto mb-8">
          Create your first case and find the perfect lawyer for your legal needs.
        </p>
        <router-link to="/cases" class="btn btn-primary btn-lg">
          🚀 Find a Lawyer Now
        </router-link>
      </div>
    </div>
  </div>
</template>
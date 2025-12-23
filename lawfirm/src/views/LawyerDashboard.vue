<!-- src/views/LawyerDashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const loading = ref(true);
const pendingRequests = ref([]);
const activeCases = ref([]);

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
</script>

<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="dashboard-header">
        <h1>Welcome back, Lawyer {{ user?.name }}! 👨‍⚖️</h1>
        <p>Review new case requests and manage your active cases.</p>
      </div>
          <router-link to="/profile" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
        View Profile
      </router-link>
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading your dashboard...</p>
      </div>

      <div v-else class="dashboard-grid">
        <div class="dashboard-main space-y-6">
          <div class="card">
            <h2 class="text-xl font-bold mb-4">📥 Pending Case Requests</h2>
            <div v-if="pendingRequests.length === 0" class="text-gray-500">
              No new case requests.
            </div>
            <ul v-else>
              <li v-for="req in pendingRequests" :key="req.id" class="border rounded-lg p-4 mb-4">
                <div class="font-bold text-gray-900 mb-1">{{ req.title }}</div>
                <p class="text-gray-600 text-sm mb-2">{{ req.description?.substring(0, 120) }}...</p>
                <div class="text-xs text-gray-500 mb-3">
                  Client: {{ req.client.name }} • {{ req.caseNumber }} • {{ formatDate(req.createdAt) }}
                </div>
                <div class="flex space-x-2">
                  <button @click="acceptRequest(req.id)" class="btn btn-success btn-sm">Accept</button>
                  <button @click="rejectRequest(req.id)" class="btn btn-danger btn-sm">Reject</button>
                  <button @click="router.push({ path: '/messages', query: { to: req.clientId } })" class="btn btn-primary btn-sm">Message Client</button>
                </div>
              </li>
            </ul>
          </div>

          <div class="card">
            <h2 class="text-xl font-bold mb-4">📁 Active Cases</h2>
            <div v-if="activeCases.length === 0" class="text-gray-500">
              You have no active cases.
            </div>
            <ul v-else>
              <li v-for="caseItem in activeCases" :key="caseItem.id" class="border-b pb-4 mb-4 last:border-0 last:pb-0">
                <div class="flex justify-between mb-1">
                  <div class="font-bold text-gray-900">{{ caseItem.title }}</div>
                  <span class="status-badge" :class="`status-${caseItem.status}`">
                    {{ caseItem.status }}
                  </span>
                </div>
                <p class="text-gray-600 text-sm mb-2">{{ caseItem.description?.substring(0, 100) }}...</p>
                <div class="text-xs text-gray-500 mb-2">
                  Client: {{ caseItem.client.name }} • {{ caseItem.caseType }} case
                </div>
                <button @click="viewCase(caseItem.id)" class="view-details-link">View Details</button>
              </li>
            </ul>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-bold mb-4">🤖 AI Legal Assistant</h2>
          <div class="chat-container">
            <div class="chat-empty">
              <p>Analyze case strategy, draft responses, or research laws.</p>
            </div>
          </div>
          <div class="chat-input-container">
            <input type="text" placeholder="Ask about this case..." class="chat-input" disabled />
            <button class="btn btn-primary chat-send-btn" disabled>Send</button>
          </div>
          <p class="ai-disclaimer">⚠️ AI advice is for reference only. Use professional judgment.</p>
        </div>
      </div>
    </div>
  </div>
</template>
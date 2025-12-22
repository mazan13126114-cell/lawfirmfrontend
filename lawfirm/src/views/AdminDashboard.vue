<!-- src/views/AdminDashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const loading = ref(true);
const activeTab = ref('dashboard');

// Stats
const stats = ref({
  totalUsers: 0,
  totalClients: 0,
  totalLawyers: 0,
  totalCases: 0,
  totalMessages: 0,
  totalAiQueries: 0,
  activeUsers: 0
});

// Data
const users = ref([]);
const cases = ref([]);
const loadingUsers = ref(false);
const loadingCases = ref(false);

// Modal
const selectedUser = ref(null);
const selectedUserCases = ref([]);
const showUserModal = ref(false);
const loadingUserDetails = ref(false);

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(storedUser);
  
  if (user.value.role !== 'admin') {
    router.push('/dashboard');
    return;
  }
  
  getDashboardStats();
});

// ==================== API METHODS ====================
const getDashboardStats = () => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/admin/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data?.overview) {
        stats.value = data.data.overview;
      }
      loading.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch stats:', err);
      loading.value = false;
    });
};

const getUsers = () => {
  loadingUsers.value = true;
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/admin/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) users.value = data.data.users || [];
      loadingUsers.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch users:', err);
      loadingUsers.value = false;
    });
};

const getCases = () => {
  loadingCases.value = true;
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/admin/cases', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) cases.value = data.data.cases || [];
      loadingCases.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch cases:', err);
      loadingCases.value = false;
    });
};

const openUserDetails = (userId) => {
  loadingUserDetails.value = true;
  showUserModal.value = true;
  const token = localStorage.getItem('token');

  fetch(`http://localhost:5000/api/admin/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        selectedUser.value = data.data.user;
        selectedUserCases.value = [
          ...(data.data.clientCases || []),
          ...(data.data.lawyerCases || [])
        ].slice(0, 5);
      }
      loadingUserDetails.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch user details:', err);
      loadingUserDetails.value = false;
    });
};

const closeUserModal = () => {
  showUserModal.value = false;
  selectedUser.value = null;
  selectedUserCases.value = [];
};

const deleteUser = (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        users.value = users.value.filter(u => u.id !== userId);
        if (selectedUser.value?.id === userId) closeUserModal();
      }
    })
    .catch(err => console.error('Failed to delete user:', err));
};

const toggleUserStatus = (userId, currentStatus) => {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive: !currentStatus })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const userIndex = users.value.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users.value[userIndex].isActive = !currentStatus;
        }
        if (selectedUser.value?.id === userId) {
          selectedUser.value.isActive = !currentStatus;
        }
      }
    })
    .catch(err => console.error('Failed to update user:', err));
};

const changeTab = (tab) => {
  activeTab.value = tab;
  if (tab === 'users' && users.value.length === 0) getUsers();
  else if (tab === 'cases' && cases.value.length === 0) getCases();
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
        <h1 class="text-3xl font-bold text-gray-900">👑 Admin Dashboard</h1>
        <p class="text-gray-600 mt-2">Manage users, cases, and system settings</p>
      </div>

      <!-- Tabs -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            @click="changeTab('dashboard')"
            :class="[
              'pb-4 px-1 border-b-2 font-medium',
              activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            ]"
          >
            Dashboard
          </button>
          <button
            @click="changeTab('users')"
            :class="[
              'pb-4 px-1 border-b-2 font-medium',
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            ]"
          >
            Users
          </button>
          <button
            @click="changeTab('cases')"
            :class="[
              'pb-4 px-1 border-b-2 font-medium',
              activeTab === 'cases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            ]"
          >
            Cases
          </button>
        </nav>
      </div>

      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'">
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="bg-white p-6 rounded-lg shadow animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Users</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalUsers }}</p>
              </div>
              <div class="text-4xl">👥</div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Clients</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalClients }}</p>
              </div>
              <div class="text-4xl">👤</div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Lawyers</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalLawyers }}</p>
              </div>
              <div class="text-4xl">👨‍⚖️</div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Cases</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalCases }}</p>
              </div>
              <div class="text-4xl">📋</div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Messages</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalMessages }}</p>
              </div>
              <div class="text-4xl">💬</div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">AI Queries</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalAiQueries }}</p>
              </div>
              <div class="text-4xl">🤖</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'">
        <div v-if="loadingUsers" class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr><th class="px-6 py-3"></th></tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200">
                <td class="px-6 py-4">
                  <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-4">
                      <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="users.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
          <p class="text-gray-500">No users found.</p>
        </div>

        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="u in users" :key="u.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ u.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-gray-500">{{ u.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                    :class="u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                           u.role === 'lawyer' ? 'bg-blue-100 text-blue-800' : 
                           'bg-green-100 text-green-800'">
                    {{ u.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ u.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(u.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button @click="openUserDetails(u.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    View
                  </button>
                  <button @click="toggleUserStatus(u.id, u.isActive)" class="text-blue-600 hover:text-blue-900 mr-3">
                    {{ u.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button v-if="u.role !== 'admin'" @click="deleteUser(u.id)" class="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cases Tab -->
      <div v-if="activeTab === 'cases'">
        <div v-if="loadingCases" class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full">
            <thead class="bg-gray-50"><tr><th class="px-6 py-3"></th></tr></thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200">
                <td class="px-6 py-4">
                  <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-4">
                      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="cases.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
          <p class="text-gray-500">No cases found.</p>
        </div>

        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case #</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lawyer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="c in cases" :key="c.id">
                <td class="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  {{ c.caseNumber }}
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">{{ c.title }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-gray-500">{{ c.client?.name || '—' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-gray-500">{{ c.lawyer?.name || 'Unassigned' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                    :class="c.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                           c.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                           c.status === 'closed' ? 'bg-green-100 text-green-800' :
                           'bg-red-100 text-red-800'">
                    {{ c.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(c.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div v-if="loadingUserDetails" class="p-8 text-center">
          <p class="text-gray-500">Loading user details...</p>
        </div>
        <div v-else-if="selectedUser" class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-900">User Details</h3>
            <button @click="closeUserModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-3">
            <p><strong>Name:</strong> {{ selectedUser.name }}</p>
            <p><strong>Email:</strong> {{ selectedUser.email }}</p>
            <p><strong>Role:</strong> 
              <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                :class="selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                       selectedUser.role === 'lawyer' ? 'bg-blue-100 text-blue-800' : 
                       'bg-green-100 text-green-800'">
                {{ selectedUser.role }}
              </span>
            </p>
            <p><strong>Status:</strong> 
              <span class="px-2 py-1 text-xs font-medium rounded-full"
                :class="selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ selectedUser.isActive ? 'Active' : 'Inactive' }}
              </span>
            </p>
            <p><strong>Verified:</strong> {{ selectedUser.isVerified ? 'Yes' : 'No' }}</p>
            <p><strong>Joined:</strong> {{ formatDate(selectedUser.createdAt) }}</p>

            <!-- Lawyer-specific fields -->
            <div v-if="selectedUser.role === 'lawyer'" class="mt-4 pt-4 border-t border-gray-200">
              <h4 class="font-medium text-gray-900 mb-2">Lawyer Details</h4>
              <p><strong>Specialization:</strong> {{ selectedUser.specialization || '—' }}</p>
              <p><strong>License Number:</strong> {{ selectedUser.licenseNumber || '—' }}</p>
              <p><strong>Experience:</strong> {{ selectedUser.experience ? `${selectedUser.experience} years` : '—' }}</p>
            </div>

            <!-- Cases -->
            <div v-if="selectedUserCases.length > 0" class="mt-4 pt-4 border-t border-gray-200">
              <h4 class="font-medium text-gray-900 mb-2">Recent Cases ({{ selectedUserCases.length }})</h4>
              <ul class="space-y-2">
                <li v-for="caseItem in selectedUserCases" :key="caseItem.id" class="text-sm">
                  <span class="font-medium">{{ caseItem.title }}</span> 
                  <span class="text-gray-500">({{ caseItem.caseNumber }})</span> • 
                  <span class="capitalize">{{ caseItem.status }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="toggleUserStatus(selectedUser.id, selectedUser.isActive)"
              class="px-4 py-2 text-sm rounded border"
              :class="selectedUser.isActive ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-green-500 text-green-500 hover:bg-green-50'"
            >
              {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              v-if="selectedUser.role !== 'admin'"
              @click="deleteUser(selectedUser.id)"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
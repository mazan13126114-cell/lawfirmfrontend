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
  <div class="dashboard-container">
    <div class="container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>👑 Admin Dashboard</h1>
        <p>Manage users, cases, and system settings</p>
      </div>

      <!-- Tabs -->
      <div class="mb-6" style="border-bottom: 1px solid #e5e7eb;">
        <nav class="flex space-x-8">
          <button
            @click="changeTab('dashboard')"
            :class="[
              'pb-4 px-1 font-medium text-base',
              activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'text-gray-500'
            ]"
            style="border-bottom: 2px solid;"
            :style="{ borderColor: activeTab === 'dashboard' ? '#2563eb' : 'transparent' }"
          >
            Dashboard
          </button>
          <button
            @click="changeTab('users')"
            :class="[
              'pb-4 px-1 font-medium text-base',
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'text-gray-500'
            ]"
            style="border-bottom: 2px solid;"
            :style="{ borderColor: activeTab === 'users' ? '#2563eb' : 'transparent' }"
          >
            Users
          </button>
          <button
            @click="changeTab('cases')"
            :class="[
              'pb-4 px-1 font-medium text-base',
              activeTab === 'cases' ? 'border-blue-600 text-blue-600' : 'text-gray-500'
            ]"
            style="border-bottom: 2px solid;"
            :style="{ borderColor: activeTab === 'cases' ? '#2563eb' : 'transparent' }"
          >
            Cases
          </button>
        </nav>
      </div>

      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'">
        <div v-if="loading" class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="card" style="animation: pulse 2s infinite;">
            <div style="height: 1.5rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 75%; margin-bottom: 1rem;"></div>
            <div style="height: 2rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 50%;"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-6">
          <div class="card">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Users</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalUsers }}</p>
              </div>
              <div class="text-4xl">👥</div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Clients</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalClients }}</p>
              </div>
              <div class="text-4xl">👤</div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Lawyers</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalLawyers }}</p>
              </div>
              <div class="text-4xl">👨‍⚖️</div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Cases</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalCases }}</p>
              </div>
              <div class="text-4xl">📋</div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Messages</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalMessages }}</p>
              </div>
              <div class="text-4xl">💬</div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center">
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
        <div v-if="loadingUsers" class="card" style="padding: 0;">
          <div style="overflow-x: auto;">
            <table style="min-width: 100%; border-collapse: collapse;">
              <thead style="background-color: #f9fafb;">
                <tr><th style="padding: 1.5rem 1.5rem;"></th></tr>
              </thead>
              <tbody>
                <tr v-for="i in 5" :key="i" style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 1.5rem 1.5rem;">
                    <div style="display: flex; gap: 1rem; animation: pulse 2s infinite;">
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
                        <div style="height: 1rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 25%;"></div>
                        <div style="height: 1rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 75%;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="users.length === 0" class="card text-center">
          <p class="text-gray-500">No users found.</p>
        </div>

        <div v-else class="card" style="padding: 0;">
          <div style="overflow-x: auto;">
            <table style="min-width: 100%; border-collapse: collapse;">
              <thead style="background-color: #f9fafb;">
                <tr>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Name</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Email</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Role</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Status</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Joined</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id" style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <div class="font-medium text-gray-900">{{ u.name }}</div>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <div class="text-gray-500">{{ u.email }}</div>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                      :class="u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                             u.role === 'lawyer' ? 'bg-blue-100 text-blue-800' : 
                             'bg-green-100 text-green-800'">
                      {{ u.role }}
                    </span>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <span class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap; font-size: 0.875rem; color: #6b7280;">
                    {{ formatDate(u.createdAt) }}
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap; font-size: 0.875rem;">
                    <button @click="openUserDetails(u.id)" class="text-indigo-600 hover:text-indigo-900 mr-3" style="color: #4f46e5;">
                      View
                    </button>
                    <button @click="toggleUserStatus(u.id, u.isActive)" class="text-blue-600 hover:text-blue-900 mr-3" style="color: #2563eb;">
                      {{ u.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button v-if="u.role !== 'admin'" @click="deleteUser(u.id)" class="text-red-600 hover:text-red-900" style="color: #dc2626;">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Cases Tab -->
      <div v-if="activeTab === 'cases'">
        <div v-if="loadingCases" class="card" style="padding: 0;">
          <div style="overflow-x: auto;">
            <table style="min-width: 100%; border-collapse: collapse;">
              <thead style="background-color: #f9fafb;"><tr><th style="padding: 1.5rem 1.5rem;"></th></tr></thead>
              <tbody>
                <tr v-for="i in 5" :key="i" style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 1.5rem 1.5rem;">
                    <div style="display: flex; gap: 1rem; animation: pulse 2s infinite;">
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
                        <div style="height: 1rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 50%;"></div>
                        <div style="height: 1rem; background-color: #e5e7eb; border-radius: 0.25rem; width: 75%;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="cases.length === 0" class="card text-center">
          <p class="text-gray-500">No cases found.</p>
        </div>

        <div v-else class="card" style="padding: 0;">
          <div style="overflow-x: auto;">
            <table style="min-width: 100%; border-collapse: collapse;">
              <thead style="background-color: #f9fafb;">
                <tr>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Case #</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Title</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Client</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Lawyer</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Status</th>
                  <th style="padding: 1.5rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in cases" :key="c.id" style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap; font-size: 0.75rem; font-family: monospace; color: #6b7280;">
                    {{ c.caseNumber }}
                  </td>
                  <td style="padding: 1.5rem 1.5rem;">
                    <div class="font-medium text-gray-900">{{ c.title }}</div>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <div class="text-gray-500">{{ c.client?.name || '—' }}</div>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <div class="text-gray-500">{{ c.lawyer?.name || 'Unassigned' }}</div>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap;">
                    <span class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                      :class="c.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                             c.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                             c.status === 'closed' ? 'bg-green-100 text-green-800' :
                             'bg-red-100 text-red-800'">
                      {{ c.status }}
                    </span>
                  </td>
                  <td style="padding: 1.5rem 1.5rem; white-space: nowrap; font-size: 0.875rem; color: #6b7280;">
                    {{ formatDate(c.createdAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="fixed inset-0" style="background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem;">
      <div class="card" style="width: 100%; max-width: 56rem; max-height: 90vh; overflow-y: auto;">
        <div v-if="loadingUserDetails" class="text-center py-8">
          <p class="text-gray-500">Loading user details...</p>
        </div>
        <div v-else-if="selectedUser" style="padding: 1.5rem;">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-900">User Details</h3>
            <button @click="closeUserModal" class="text-gray-500 hover:text-gray-700" style="border: none; background: none; cursor: pointer; font-size: 1.5rem; line-height: 1;">
              ×
            </button>
          </div>

          <div class="space-y-3" style="display: flex; flex-direction: column; gap: 0.75rem;">
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
            <div v-if="selectedUser.role === 'lawyer'" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <h4 class="font-medium text-gray-900 mb-2">Lawyer Details</h4>
              <p><strong>Specialization:</strong> {{ selectedUser.specialization || '—' }}</p>
              <p><strong>License Number:</strong> {{ selectedUser.licenseNumber || '—' }}</p>
              <p><strong>Experience:</strong> {{ selectedUser.experience ? `${selectedUser.experience} years` : '—' }}</p>
            </div>

            <!-- Cases -->
            <div v-if="selectedUserCases.length > 0" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <h4 class="font-medium text-gray-900 mb-2">Recent Cases ({{ selectedUserCases.length }})</h4>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem;">
                <li v-for="caseItem in selectedUserCases" :key="caseItem.id" style="font-size: 0.875rem;">
                  <span class="font-medium">{{ caseItem.title }}</span> 
                  <span class="text-gray-500">({{ caseItem.caseNumber }})</span> • 
                  <span class="capitalize">{{ caseItem.status }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button
              @click="toggleUserStatus(selectedUser.id, selectedUser.isActive)"
              class="px-4 py-2 text-sm rounded border"
              :class="selectedUser.isActive ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-green-500 text-green-500 hover:bg-green-50'"
              style="padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: 0.25rem;"
              :style="{ borderColor: selectedUser.isActive ? '#dc2626' : '#22c55e', color: selectedUser.isActive ? '#dc2626' : '#22c55e' }"
            >
              {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              v-if="selectedUser.role !== 'admin'"
              @click="deleteUser(selectedUser.id)"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              style="padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: 0.25rem; background-color: #ef4444; color: white;"
              onmouseover="this.style.backgroundColor='#dc2626'"
              onmouseout="this.style.backgroundColor='#ef4444'"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Grid system for responsive cards */
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

/* Utility classes */
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.rounded-full {
  border-radius: 9999px;
}

.capitalize {
  text-transform: capitalize;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

/* Status badge colors */
.bg-purple-100 { background-color: #f3e8ff; }
.text-purple-800 { color: #7e22ce; }

.bg-blue-100 { background-color: #dbeafe; }
.text-blue-800 { color: #1e40af; }

.bg-green-100 { background-color: #dcfce7; }
.text-green-800 { color: #166534; }

.bg-yellow-100 { background-color: #fef3c7; }
.text-yellow-800 { color: #92400e; }

.bg-red-100 { background-color: #fee2e2; }
.text-red-800 { color: #b91c1c; }

/* Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Fixed positioning */
.fixed {
  position: fixed;
}
</style>
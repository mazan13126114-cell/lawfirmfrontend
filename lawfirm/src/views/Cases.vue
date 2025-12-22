<!-- src/views/Cases.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// ✅ New ref for scroll-to-top
const casesTop = ref(null);

const cases = ref([]);
const user = ref(null);
const loading = ref(true);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const activeFilter = ref('all');

// New case form
const newCaseTitle = ref('');
const newCaseDescription = ref('');
const newCaseType = ref('civil');
const newCasePriority = ref('medium');

// AI Evaluation
const aiEvalLoading = ref(false);
const aiEvalResult = ref(null);

// Lawyer listing
const lawyers = ref([]);
const loadingLawyers = ref(false);

// Message modal
const showMessageModal = ref(false);
const messageText = ref('');
const selectedLawyerId = ref(null);
const messageLoading = ref(false);
const messageError = ref('');

// Create-for-lawyer modal
const showCreateForLawyerModal = ref(false);
const createForLawyerTitle = ref('');
const createForLawyerDesc = ref('');
const createForLawyerType = ref('civil');
const createForLawyerLoading = ref(false);
const createForLawyerError = ref('');

const isClient = computed(() => user.value?.role === 'client');

const filteredCases = computed(() => {
  if (activeFilter.value === 'all') return cases.value;
  return cases.value.filter(c => c.status === activeFilter.value);
});

const filterOptions = [
  { label: 'All Cases', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Closed', value: 'closed' },
];

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(storedUser);
  getCases();
  fetchLawyers();
  
  // ✅ Scroll to top of cases list when entering page
  if (casesTop.value) {
    casesTop.value.scrollIntoView({ behavior: 'smooth' });
  }
});

// Fetch user's cases
const getCases = () => {
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

// Create a new case (client-only, no lawyer assigned)
const createCase = () => {
  if (!newCaseTitle.value.trim() || !newCaseDescription.value.trim()) {
    createError.value = 'Title and description are required';
    return;
  }
  creating.value = true;
  createError.value = '';
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: newCaseTitle.value,
      description: newCaseDescription.value,
      caseType: newCaseType.value,
      priority: newCasePriority.value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        cases.value.unshift(data.data.case);
        closeModal();
        router.push(`/cases/${data.data.case.id}`);
      } else {
        createError.value = data.message || 'Failed to create case';
      }
      creating.value = false;
    })
    .catch(err => {
      createError.value = 'Network error. Please try again.';
      creating.value = false;
    });
};

const viewCase = (caseId) => {
  router.push(`/cases/${caseId}`);
};

const closeModal = () => {
  showCreateModal.value = false;
  createError.value = '';
  newCaseTitle.value = '';
  newCaseDescription.value = '';
  newCaseType.value = 'civil';
  newCasePriority.value = 'medium';
};

const getFilterCount = (filter) => {
  if (filter === 'all') return cases.value.length;
  return cases.value.filter(c => c.status === filter).length;
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    ongoing: 'bg-blue-100 text-blue-800',
    closed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    review: 'bg-purple-100 text-purple-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Fetch lawyers (public endpoint)
const fetchLawyers = () => {
  loadingLawyers.value = true;
  fetch('http://localhost:5000/api/lawyers')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        lawyers.value = data.data.users || [];
      }
      loadingLawyers.value = false;
    })
    .catch(err => {
      console.error('Failed to fetch lawyers:', err);
      loadingLawyers.value = false;
    });
};

// Message modal
const openMessageModal = (lawyerId) => {
  selectedLawyerId.value = lawyerId;
  messageText.value = '';
  messageError.value = '';
  showMessageModal.value = true;
};

const closeMessageModal = () => {
  showMessageModal.value = false;
};

const sendMessageToLawyer = () => {
  if (!messageText.value.trim()) {
    messageError.value = 'Message cannot be empty.';
    return;
  }
  messageLoading.value = true;
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      receiverId: selectedLawyerId.value,
      message: messageText.value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        closeMessageModal();
      } else {
        messageError.value = data.message || 'Failed to send message.';
      }
      messageLoading.value = false;
    })
    .catch(err => {
      messageError.value = 'Failed to send message.';
      messageLoading.value = false;
    });
};

// Create case for specific lawyer
const openCreateForLawyer = (lawyerId) => {
  selectedLawyerId.value = lawyerId;
  createForLawyerError.value = '';
  showCreateForLawyerModal.value = true;
};

const closeCreateForLawyer = () => {
  showCreateForLawyerModal.value = false;
};

const createCaseForLawyer = () => {
  if (!createForLawyerTitle.value.trim() || !createForLawyerDesc.value.trim()) {
    createForLawyerError.value = 'Title and description are required';
    return;
  }
  createForLawyerLoading.value = true;
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: createForLawyerTitle.value,
      description: createForLawyerDesc.value,
      caseType: createForLawyerType.value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        cases.value.unshift(data.data.case);
        closeCreateForLawyer();
        router.push(`/cases/${data.data.case.id}`);
      } else {
        createForLawyerError.value = data.message || 'Failed to create case';
      }
      createForLawyerLoading.value = false;
    })
    .catch(err => {
      createForLawyerError.value = 'Network error.';
      createForLawyerLoading.value = false;
    });
};

// AI Case Evaluation
const evaluateCase = (title, description, caseType) => {
  aiEvalLoading.value = true;
  aiEvalResult.value = null;
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/ai/predict-case', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, caseType })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        aiEvalResult.value = data.data;
      }
    })
    .catch(err => {
      console.error('AI evaluation failed:', err);
    })
    .finally(() => {
      aiEvalLoading.value = false;
    });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Cases</h1>
          <p class="text-gray-600 mt-2">Manage and track your legal cases</p>
        </div>
        <button
          v-if="isClient"
          @click="showCreateModal = true"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          + New Case
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            v-for="status in filterOptions"
            :key="status.value"
            @click="activeFilter = status.value"
            :class="[
              'pb-4 px-1 border-b-2 font-medium text-sm',
              activeFilter === status.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            {{ status.label }}
            <span
              v-if="getFilterCount(status.value) > 0"
              :class="[
                'ml-2 py-0.5 px-2 rounded-full text-xs',
                activeFilter === status.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ getFilterCount(status.value) }}
            </span>
          </button>
        </nav>
      </div>

      <!-- ✅ Loading State -->
      <div ref="casesTop" v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading cases...</p>
      </div>

      <!-- ✅ Empty State -->
      <div 
        ref="casesTop"
        v-else-if="filteredCases.length === 0" 
        class="text-center py-12 bg-white rounded-lg shadow"
      >
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
        <p class="text-gray-600 mb-6">
          {{ activeFilter === 'all' ? 'You haven\'t created any cases yet.' : `No ${activeFilter} cases.` }}
        </p>
        <button
          v-if="isClient"
          @click="showCreateModal = true"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Create Your First Case
        </button>
      </div>

      <!-- ✅ Cases Grid -->
      <div 
        ref="casesTop"
        v-else 
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="caseItem in filteredCases"
          :key="caseItem.id"
          class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
          @click="viewCase(caseItem.id)"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-lg text-gray-900">{{ caseItem.title }}</h3>
            <span :class="getStatusClass(caseItem.status)" class="text-xs px-2 py-1 rounded-full font-medium capitalize">
              {{ caseItem.status }}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-4">{{ caseItem.description?.substring(0, 120) }}{{ caseItem.description?.length > 120 ? '...' : '' }}</p>
          <div class="space-y-1 text-sm text-gray-600">
            <div>Type: <span class="capitalize">{{ caseItem.caseType }}</span></div>
            <div v-if="caseItem.probabilityScore">Success Rate: <span class="text-green-600">{{ caseItem.probabilityScore }}%</span></div>
            <div>Created: {{ formatDate(caseItem.createdAt) }}</div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200 text-sm">
            <div v-if="caseItem.lawyer">Lawyer: {{ caseItem.lawyer.name }}</div>
            <div v-else class="text-gray-500">No lawyer assigned</div>
          </div>
        </div>
      </div>

      <!-- Create Case Modal -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Create New Case</h2>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <form @submit.prevent="createCase" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Case Title *</label>
              <input v-model="newCaseTitle" type="text" class="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description *</label>
              <textarea v-model="newCaseDescription" rows="4" class="w-full px-3 py-2 border rounded" required></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Case Type *</label>
              <select v-model="newCaseType" class="w-full px-3 py-2 border rounded" required>
                <option value="civil">Civil</option>
                <option value="criminal">Criminal</option>
                <option value="family">Family</option>
                <option value="property">Property</option>
                <option value="corporate">Corporate</option>
                <option value="labor">Labor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Priority</label>
              <select v-model="newCasePriority" class="w-full px-3 py-2 border rounded">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div v-if="createError" class="text-red-600">{{ createError }}</div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" :disabled="creating" class="px-4 py-2 bg-blue-600 text-white rounded">
                {{ creating ? 'Creating...' : 'Create Case' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Lawyer Section -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold mb-6 text-center">Find a Lawyer</h2>
        <div v-if="loadingLawyers" class="text-center py-4">Loading lawyers...</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="lawyer in lawyers" :key="lawyer.id" class="bg-white rounded-lg shadow p-5">
            <div class="font-bold text-lg">{{ lawyer.name }}</div>
            <div class="text-sm text-gray-600">{{ lawyer.email }}</div>
            <div v-if="lawyer.specialization" class="mt-1">
              <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{{ lawyer.specialization }}</span>
            </div>
            <div class="mt-4 flex gap-2">
              <button @click="openMessageModal(lawyer.id)" class="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                Message
              </button>
              <button @click="openCreateForLawyer(lawyer.id)" class="px-3 py-1 bg-green-600 text-white text-sm rounded">
                Request Case
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Modal -->
      <div v-if="showMessageModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 class="font-bold mb-3">Send Message</h3>
          <textarea v-model="messageText" rows="3" class="w-full border rounded p-2 mb-2" placeholder="Your message..."></textarea>
          <div v-if="messageError" class="text-red-600 text-sm mb-2">{{ messageError }}</div>
          <div class="flex justify-end gap-2">
            <button @click="closeMessageModal" class="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button @click="sendMessageToLawyer" :disabled="messageLoading" class="px-3 py-1 bg-blue-600 text-white rounded">
              {{ messageLoading ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create for Lawyer Modal -->
      <div v-if="showCreateForLawyerModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 class="font-bold mb-3">Request Case from Lawyer</h3>
          <input v-model="createForLawyerTitle" placeholder="Case title" class="w-full border rounded p-2 mb-2" />
          <textarea v-model="createForLawyerDesc" placeholder="Case description" class="w-full border rounded p-2 mb-2" rows="3"></textarea>
          <select v-model="createForLawyerType" class="w-full border rounded p-2 mb-2">
            <option value="civil">Civil</option>
            <option value="criminal">Criminal</option>
            <option value="family">Family</option>
            <option value="property">Property</option>
            <option value="corporate">Corporate</option>
            <option value="other">Other</option>
          </select>
          <div v-if="createForLawyerError" class="text-red-600 text-sm mb-2">{{ createForLawyerError }}</div>
          <div class="flex justify-end gap-2">
            <button @click="closeCreateForLawyer" class="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button @click="createCaseForLawyer" :disabled="createForLawyerLoading" class="px-3 py-1 bg-green-600 text-white rounded">
              {{ createForLawyerLoading ? 'Creating...' : 'Submit Request' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
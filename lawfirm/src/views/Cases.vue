<!-- src/views/Cases.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

//  New ref for scroll-to-top
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
  
  // Scroll to top of cases list when entering page
  setTimeout(() => {
    if (casesTop.value) {
      casesTop.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
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
    pending: 'status-pending',
    assigned: 'status-pending',
    ongoing: 'status-ongoing',
    closed: 'status-closed',
    rejected: 'status-rejected',
    review: 'status-default'
  };
  return classes[status] || 'status-default';
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
  <div class="dashboard-container">
    <div class="container">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Cases</h1>
          <p class="text-gray-600 mt-2">Manage and track your legal cases</p>
        </div>
        <button
          v-if="isClient"
          @click="showCreateModal = true"
          class="btn btn-primary"
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

      <!--  Loading State -->
      <div ref="casesTop" v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading cases...</p>
      </div>

      <!--  Empty State -->
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
          class="btn btn-primary"
        >
          Create Your First Case
        </button>
      </div>

      <!-- Cases Grid -->
      <div 
        ref="casesTop"
        v-else 
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="caseItem in filteredCases"
          :key="caseItem.id"
          class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg"
          @click="viewCase(caseItem.id)"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-lg text-gray-900">{{ caseItem.title }}</h3>
            <span :class="['status-badge', getStatusClass(caseItem.status)]" class="text-xs px-2 py-1 rounded-full font-medium capitalize">
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

      <!-- Lawyer Section -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold mb-6 text-center">Find a Lawyer</h2>
        <div v-if="loadingLawyers" class="text-center py-4">Loading lawyers...</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="lawyer in lawyers" :key="lawyer.id" class="bg-white rounded-lg shadow p-5">
            <div class="font-bold text-lg">{{ lawyer.name }}</div>
            <div class="text-sm text-gray-600">{{ lawyer.email }}</div>
            <div v-if="lawyer.specialization" class="mt-1">
              <span class="status-badge status-ongoing">{{ lawyer.specialization }}</span>
            </div>
            <div class="mt-4 flex gap-2">
              <button @click="openMessageModal(lawyer.id)" class="btn btn-primary btn-sm">Message</button>
              <button @click="openCreateForLawyer(lawyer.id)" class="btn btn-success btn-sm">Request Case</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Case Modal -->
      <div v-show="showCreateModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Create New Case</h2>
            <button @click="closeModal" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div v-if="createError" class="alert alert-error">{{ createError }}</div>
            <div>
              <label class="form-label">Case Title *</label>
              <input v-model="newCaseTitle" type="text" class="form-input" required />
            </div>
            <div>
              <label class="form-label">Description *</label>
              <textarea v-model="newCaseDescription" rows="4" class="form-input" required></textarea>
            </div>
            <div>
              <label class="form-label">Case Type *</label>
              <select v-model="newCaseType" class="form-input" required>
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
              <label class="form-label">Priority</label>
              <select v-model="newCasePriority" class="form-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button @click="createCase" :disabled="creating" class="btn btn-primary">
              {{ creating ? 'Creating...' : 'Create Case' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Message Modal -->
      <div v-show="showMessageModal" class="modal-overlay" @click.self="closeMessageModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Send Message</h3>
            <button @click="closeMessageModal" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <textarea 
              v-model="messageText" 
              rows="3" 
              class="form-input" 
              placeholder="Your message..."
            ></textarea>
            <div v-if="messageError" class="alert alert-error">{{ messageError }}</div>
          </div>
          <div class="modal-footer">
            <button @click="closeMessageModal" class="btn btn-secondary">Cancel</button>
            <button @click="sendMessageToLawyer" :disabled="messageLoading" class="btn btn-primary">
              {{ messageLoading ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create for Lawyer Modal -->
      <div v-show="showCreateForLawyerModal" class="modal-overlay" @click.self="closeCreateForLawyer">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Request Case from Lawyer</h3>
            <button @click="closeCreateForLawyer" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <input 
              v-model="createForLawyerTitle" 
              placeholder="Case title" 
              class="form-input" 
            />
            <textarea 
              v-model="createForLawyerDesc" 
              placeholder="Case description" 
              class="form-input" 
              rows="3"
            ></textarea>
            <select v-model="createForLawyerType" class="form-input">
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="property">Property</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
            <div v-if="createForLawyerError" class="alert alert-error">{{ createForLawyerError }}</div>
          </div>
          <div class="modal-footer">
            <button @click="closeCreateForLawyer" class="btn btn-secondary">Cancel</button>
            <button @click="createCaseForLawyer" :disabled="createForLawyerLoading" class="btn btn-success">
              {{ createForLawyerLoading ? 'Creating...' : 'Submit Request' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 48rem;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
}

.modal-close:hover {
  color: #6b7280;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Alert boxes */
.alert {
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.alert-error {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

/* Grid system */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

.md\:grid-cols-2 {
  grid-template-columns: 1fr 1fr;
}

.lg\:grid-cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
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

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 1rem;
  }
}
</style>
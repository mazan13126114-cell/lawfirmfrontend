<!-- src/views/Messages.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const conversations = ref([]);
const activeConversation = ref(null);
const messages = ref([]);
const newMessageText = ref('');
const loading = ref(false);
const error = ref('');
const user = ref(null);

const currentPartnerId = ref(null);
const currentCaseId = ref(null);

onMounted(() => {
  // Load user from localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
  
  fetchConversations();
  
  if (route.query.to) {
    // ✅ Convert to NUMBER immediately
    currentPartnerId.value = parseInt(route.query.to);
    currentCaseId.value = route.query.caseId ? parseInt(route.query.caseId) : null;
    selectConversation(currentPartnerId.value);
  }
});

const fetchConversations = () => {
  loading.value = true;
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/messages/conversations', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      conversations.value = data.success ? data.data.conversations || [] : [];
    })
    .catch(err => {
      error.value = 'Failed to load conversations';
    })
    .finally(() => {
      loading.value = false;
    });
};

const selectConversation = (userId, caseId = null) => {
  // ✅ Ensure userId is NUMBER
  const numUserId = parseInt(userId);
  currentPartnerId.value = numUserId;
  currentCaseId.value = caseId ? parseInt(caseId) : null;
  
  // Find the conversation that matches both user and case
  activeConversation.value = conversations.value.find(
    c => c.user.id === numUserId && (c.case?.id === currentCaseId.value || (currentCaseId.value === null && !c.case))
  ) || null;
  
  fetchMessages(numUserId);
};

const fetchMessages = (userId) => {
  const token = localStorage.getItem('token');
  let url = `http://localhost:5000/api/messages/conversation/${userId}`;
  
  if (currentCaseId.value) {
    url += `?caseId=${currentCaseId.value}`;
  }
  
  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        messages.value = (data.data.messages || []).map(msg => ({
          ...msg,
          // Ensure sender info is included
          sender: msg.sender || { name: 'Unknown', id: msg.senderId }
        }));
      } else {
        messages.value = [];
      }
    })
    .catch(err => {
      console.error('Failed to fetch messages:', err);
      error.value = 'Failed to load messages';
    });
};

// ✅ FIXED: Proper message sending
const sendMessage = () => {
  if (!newMessageText.value.trim() || !currentPartnerId.value) return;
  
  const token = localStorage.getItem('token');
  
  // ✅ Send receiverId as NUMBER (critical fix)
  const payload = {
    receiverId: parseInt(currentPartnerId.value), // ← MUST be number
    message: newMessageText.value.trim()
  };
  
  if (currentCaseId.value) {
    payload.caseId = parseInt(currentCaseId.value);
  }
  
  fetch('http://localhost:5000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        newMessageText.value = '';
        fetchMessages(currentPartnerId.value);
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    })
    .catch(err => {
      console.error('Message send error:', err);
      error.value = 'Failed to send message. Please try again.';
    });
};

const formatDate = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

      <div class="flex gap-6">
        <!-- Sidebar: Conversations -->
        <div class="w-1/3 bg-white rounded-lg shadow p-4 h-[700px] overflow-y-auto">
          <h2 class="font-bold text-lg mb-4">Conversations</h2>
          <div v-if="loading" class="text-gray-500">Loading...</div>
          <div v-else-if="conversations.length === 0" class="text-gray-500">No conversations</div>
          <ul class="space-y-3">
            <li
              v-for="conv in conversations"
              :key="`${conv.user.id}-${conv.case?.id || 'direct'}`"
              @click="selectConversation(conv.user.id, conv.case?.id)"
              :class="activeConversation?.user.id === conv.user.id && activeConversation?.case?.id === (conv.case?.id || null) ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'"
              class="p-3 rounded cursor-pointer border-l-4 border-transparent"
            >
              <div class="font-bold text-sm">{{ conv.user.name }}</div>
              <div v-if="conv.case" class="text-xs text-purple-600 font-semibold mb-1">
                📋 {{ conv.case.title }}
              </div>
              <div class="text-sm text-gray-600 truncate">{{ conv.lastMessage?.message?.substring(0, 30) || 'No messages' }}</div>
              <div v-if="conv.unreadCount" class="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center mt-1 inline-block">
                {{ conv.unreadCount }}
              </div>
            </li>
          </ul>
        </div>

        <!-- Main Chat Area -->
        <div class="flex-1 flex flex-col">
          <div v-if="!activeConversation" class="bg-white rounded-lg shadow flex-1 flex items-center justify-center">
            <p class="text-gray-500">Select a conversation to start messaging</p>
          </div>
          
          <div v-else class="flex flex-col h-full">
            <div class="bg-white rounded-t-lg shadow p-4 border-b">
              <h2 class="font-bold text-lg">
                💬 Chat with {{ activeConversation.user.name }}
                <span v-if="activeConversation.case" class="text-sm text-gray-600 ml-2">
                  📋 (Case: {{ activeConversation.case.title }})
                </span>
                <span v-else class="text-sm text-gray-600 ml-2">
                  (Direct message)
                </span>
              </h2>
            </div>
            
            <div class="bg-white flex-1 overflow-y-auto p-4 space-y-3">
              <div v-for="msg in messages" :key="msg.id" class="flex flex-col" :class="msg.senderId == user?.id ? 'items-end' : 'items-start'">
                <div class="text-xs text-gray-500 mb-1">
                  {{ msg.sender?.name }} · {{ formatDate(msg.createdAt) }}
                </div>
                <div
                  class="max-w-xs px-4 py-2 rounded-lg"
                  :class="msg.senderId == user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
                >
                  {{ msg.message }}
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-b-lg shadow p-4 border-t">
              <div class="flex gap-2">
                <input
                  v-model="newMessageText"
                  @keyup.enter="sendMessage"
                  type="text"
                  placeholder="Type your message..."
                  class="flex-1 px-4 py-2 border border-gray-300 rounded"
                />
                <button
                  @click="sendMessage"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-red-600 text-center">{{ error }}</p>
    </div>
  </div>
</template>
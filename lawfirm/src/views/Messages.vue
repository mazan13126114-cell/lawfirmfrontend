<!-- src/views/Messages.vue -->
<script setup>
import { ref, onMounted } from 'vue';
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
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
  
  fetchConversations();
  
  if (route.query.to) {
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
  const numUserId = parseInt(userId);
  currentPartnerId.value = numUserId;
  currentCaseId.value = caseId ? parseInt(caseId) : null;
  
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
        messages.value = data.data.messages || [];
      } else {
        messages.value = [];
      }
    })
    .catch(err => {
      console.error('Failed to fetch messages:', err);
      error.value = 'Failed to load messages';
    });
};

const sendMessage = () => {
  if (!newMessageText.value.trim() || !currentPartnerId.value) return;
  
  const token = localStorage.getItem('token');
  const payload = {
    receiverId: parseInt(currentPartnerId.value),
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
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        newMessageText.value = '';
        fetchMessages(currentPartnerId.value);
      } else {
        error.value = data.message || 'Failed to send message';
      }
    })
    .catch(err => {
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
  <div class="dashboard-container">
    <div class="container">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

      <div class="messages-layout">
        <!-- Conversations Sidebar -->
        <div class="conversations-sidebar">
          <h2 class="font-bold text-lg mb-4">Conversations</h2>
          <div v-if="loading" class="text-gray-500">Loading...</div>
          <div v-else-if="conversations.length === 0" class="text-gray-500">No conversations</div>
          <div v-else class="conversations-list">
            <div
              v-for="conv in conversations"
              :key="`${conv.user.id}-${conv.case?.id || 'direct'}`"
              @click="selectConversation(conv.user.id, conv.case?.id)"
              :class="[
                'conversation-item',
                activeConversation?.user.id === conv.user.id && 
                activeConversation?.case?.id === (conv.case?.id || null) 
                  ? 'active-conversation' 
                  : 'hover-conversation'
              ]"
            >
              <div class="font-bold">{{ conv.user.name }}</div>
              <div v-if="conv.case" class="case-title">
                📋 {{ conv.case.title }}
              </div>
              <div class="text-gray-600 message-preview">
                {{ conv.lastMessage?.message?.substring(0, 30) || 'No messages' }}
              </div>
              <div v-if="conv.unreadCount" class="unread-badge">
                {{ conv.unreadCount }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-container">
          <div v-if="!activeConversation" class="empty-chat">
            <p class="text-gray-500">Select a conversation to start messaging</p>
          </div>
          
          <div v-else class="chat-full">
            <div class="chat-header">
              💬 Chat with {{ activeConversation.user.name }}
              <span v-if="activeConversation.case" class="case-context">
                📋 (Case: {{ activeConversation.case.title }})
              </span>
            </div>
            
            <div class="messages-list">
              <div 
                v-for="msg in messages" 
                :key="msg.id"
                :class="msg.senderId == user?.id ? 'message-right' : 'message-left'"
              >
                <div class="message-sender">
                  {{ msg.sender?.name || 'Unknown' }} · {{ formatDate(msg.createdAt) }}
                </div>
                <div class="message-bubble">
                  {{ msg.message }}
                </div>
              </div>
            </div>
            
            <div class="message-input">
              <input
                v-model="newMessageText"
                @keyup.enter="sendMessage"
                type="text"
                placeholder="Type your message..."
                class="form-input"
              />
              <button @click="sendMessage" class="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Main layout */
.messages-layout {
  display: flex;
  gap: 1.5rem;
}

/* Conversations Sidebar */
.conversations-sidebar {
  width: 33.333%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
  height: 700px;
  overflow-y: auto;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conversation-item {
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  border-left: 4px solid transparent;
}

.active-conversation {
  background-color: #eff6ff;
  border-left-color: #2563eb;
}

.hover-conversation:hover {
  background-color: #f3f4f6;
}

.case-title {
  color: #7c2d87;
  font-weight: 600;
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.message-preview {
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  background-color: #ef4444;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Chat Area */
.chat-container {
  flex: 1;
}

.empty-chat {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 700px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-full {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 700px;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 1.125rem;
}

.case-context {
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: 0.5rem;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-left {
  text-align: left;
}

.message-right {
  text-align: right;
}

.message-sender {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.message-bubble {
  max-width: 80%;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.message-left .message-bubble {
  background-color: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.message-right .message-bubble {
  background-color: #2563eb;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-input {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
}

.message-input .form-input {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.message-input .btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Error message */
.error-message {
  color: #dc2626;
  text-align: center;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .messages-layout {
    flex-direction: column;
  }
  
  .conversations-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .chat-container .chat-full,
  .chat-container .empty-chat {
    height: 400px;
  }
}
</style>
<!-- src/components/ResetPasswordForm.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  email: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'back'])

const newPassword = ref('')
const confirmPassword = ref('')

const handleSubmit = () => {
  emit('submit', newPassword.value, confirmPassword.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <p class="text-sm text-gray-600 text-center mb-4">
      Resetting password for: <strong>{{ email }}</strong>
    </p>

    <div class="form-group">
      <label for="newPassword" class="form-label">New Password</label>
      <input
        id="newPassword"
        v-model="newPassword"
        type="password"
        placeholder="Enter new password"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="confirmPassword" class="form-label">Confirm Password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        required
        class="form-input"
      />
    </div>

    <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
    <p v-if="message" class="text-green-600 text-sm text-center">{{ message }}</p>

    <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
      {{ loading ? 'Resetting...' : 'Confirm New Password' }}
    </button>

    <button type="button" class="btn btn-secondary btn-block" @click="$emit('back')">
      ← Back
    </button>
  </form>
</template>

<style scoped>
.space-y-4 {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

.btn-block {
  width: 100%;
}

.text-red-600 {
  color: #dc3545;
}

.text-green-600 {
  color: #28a745;
}

.text-sm {
  font-size: 14px;
}

.text-gray-600 {
  color: #666;
}

.text-center {
  text-align: center;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>

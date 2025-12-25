<!-- src/views/ResetPassword.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref('')
const error = ref('')

// Get token from URL when component loads
onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    error.value = 'Invalid or missing reset token'
  }
})

const handleSubmit = () => {
  if (!password.value || !confirmPassword.value) {
    error.value = 'Both password fields are required'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (!token.value) {
    error.value = 'Invalid reset token'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''

  // CORRECT: Call reset-password endpoint with token
  fetch('http://localhost:5000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token.value,        // token from email link
      password: password.value   //  new password
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        success.value = 'Password reset successfully! Redirecting to login...'
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        error.value = data.message || 'Failed to reset password'
      }
    })
    .catch(err => {
      error.value = 'Failed to reset password. Please try again.'
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Reset Password</h1>
      
      <div v-if="error && !token" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm text-center mb-4">
        {{ error }}
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label for="password" class="form-label">New Password</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="Enter new password" 
            required 
            class="form-input" 
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm New Password</label>
          <input 
            id="confirmPassword" 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Confirm new password" 
            required 
            class="form-input" 
          />
        </div>
        
        <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm text-center">
          {{ success }}
        </div>
        
        <p v-if="error && token" class="text-red-600 text-sm text-center">{{ error }}</p>
        
        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
      
      <p class="text-center mt-6">
        <router-link to="/" class="text-blue-600 hover:underline">← Back to Login</router-link>
      </p>
    </div>
  </div>
</template>
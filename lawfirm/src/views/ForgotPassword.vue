<!-- src/views/ForgotPassword.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const step = ref('email') // 'email' or 'reset'

const handleEmailSubmit = async () => {
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  // Just proceed to password reset form without calling API
  message.value = 'Please enter your new password'
  step.value = 'reset'
  error.value = ''
}

const handlePasswordReset = async () => {
  if (!newPassword.value || !confirmPassword.value) {
    error.value = 'Both password fields are required'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await fetch('http://localhost:5000/api/auth/reset-password-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: newPassword.value
      })
    })

    const data = await response.json()

    if (data.success) {
      message.value = 'Password reset successfully! Redirecting to login...'
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      error.value = data.message || 'Failed to reset password'
    }
  } catch (err) {
    error.value = 'Error resetting password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">{{ step === 'email' ? 'Forgot Password' : 'Reset Password' }}</h1>

      <!-- Step 1: Email Entry -->
      <div v-if="step === 'email'">
        <form @submit.prevent="handleEmailSubmit" class="space-y-4">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email address"
              required
              class="form-input"
            />
          </div>

          <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
          <p v-if="message" class="text-green-600 text-sm text-center">{{ message }}</p>

          <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
            {{ loading ? 'Verifying...' : 'Continue' }}
          </button>
        </form>
      </div>

      <!-- Step 2: Password Reset -->
      <div v-if="step === 'reset'">
        <form @submit.prevent="handlePasswordReset" class="space-y-4">
          <div class="form-group">
            <label for="newPassword" class="form-label">New Password</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="Enter your new password"
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
              placeholder="Confirm your new password"
              required
              class="form-input"
            />
          </div>

          <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
          <p v-if="message" class="text-green-600 text-sm text-center">{{ message }}</p>

          <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>

          <button type="button" @click="() => { step = 'email'; newPassword = ''; confirmPassword = ''; error = ''; message = '' }" class="btn btn-secondary btn-block" :disabled="loading">
            ← Back
          </button>
        </form>
      </div>

      <p class="text-center mt-6">
        <router-link to="/" class="text-blue-600 hover:underline">← Back to Login</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

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
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.text-center {
  text-align: center;
}

.mt-6 {
  margin-top: 24px;
}
</style>

<!-- src/views/ForgotPassword.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ResetPasswordForm from '../components/ResetPasswordForm.vue'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const step = ref('email') // 'email' or 'reset'

const handleEmailSubmit = async () => {
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })

    const data = await response.json()

    if (data.success) {
      message.value = 'Email found! You can now reset your password.'
      step.value = 'reset'
      setTimeout(() => {
        message.value = ''
      }, 3000)
    } else {
      error.value = data.message || 'Email not found'
    }
  } catch (err) {
    error.value = 'Error connecting to server. Please try again.'
  } finally {
    loading.value = false
  }
}

const handlePasswordReset = async (newPassword, confirmPassword) => {
  if (!newPassword || !confirmPassword) {
    error.value = 'Both password fields are required'
    return
  }

  if (newPassword !== confirmPassword) {
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
        password: newPassword
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
      <ResetPasswordForm
        v-else
        :email="email"
        :loading="loading"
        :error="error"
        :message="message"
        @submit="handlePasswordReset"
        @back="step = 'email'"
      />

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

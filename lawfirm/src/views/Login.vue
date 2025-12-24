<!-- src/views/Login.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = () => {
  loading.value = true
  error.value = ''

  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
    .then(response => response.json().then(data => ({ response, data })))
    .then(({ response, data }) => {
      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    })
    .catch(err => {
      error.value = err.message
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">LawConnect</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input id="email" v-model="email" type="email" placeholder="Enter your email" required class="form-input" />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Enter your password" required class="form-input" />
        </div>
        <!-- ✅ SIMPLE FORGOT PASSWORD -->
        <div class="text-right">
          <router-link to="/forgot-password" class="text-blue-600 text-sm hover:underline">
            Forgot password?
          </router-link>
        </div>
        <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="signup-link">
        Don't have an account?
        <router-link to="/register" class="signup-link-text">Sign up here</router-link>
      </p>
    </div>
  </div>
</template>
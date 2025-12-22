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
        // ✅ Use consistent keys: 'token' and 'user'
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
  <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 px-4">
    <div class="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">LawConnect</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input id="email" v-model="email" type="email" placeholder="Enter your email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Enter your password" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
        <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-70">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="text-center text-gray-600 mt-6">
        Don't have an account?
        <router-link to="/register" class="text-blue-500 font-semibold hover:underline">Sign up here</router-link>
      </p>
    </div>
  </div>
</template>
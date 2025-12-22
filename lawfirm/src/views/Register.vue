<!-- src/views/Register.vue -->
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const formData = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'client',
  specialization: '',
  licenseNumber: '',
  experience: ''
})

const handleRegister = () => {
  loading.value = true
  error.value = ''
  fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(response => response.json().then(data => ({ response, data })))
    .then(({ response, data }) => {
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
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
  <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-8">
    <div class="bg-white rounded-lg shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">LawConnect - Sign Up</h1>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input v-model="formData.name" id="name" type="text" placeholder="Enter your full name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input v-model="formData.email" id="email" type="email" placeholder="Enter your email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input v-model="formData.password" id="password" type="password" placeholder="Enter your password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input v-model="formData.phone" id="phone" type="tel" placeholder="Enter your phone number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select v-model="formData.role" id="role" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="client">Client</option>
            <option value="lawyer">Lawyer</option>
          </select>
        </div>
        <div v-if="formData.role === 'lawyer'" class="bg-blue-50 p-4 rounded-lg space-y-3">
          <div>
            <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
            <input v-model="formData.specialization" id="specialization" type="text" placeholder="e.g., Corporate Law" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label for="licenseNumber" class="block text-sm font-medium text-gray-700 mb-2">License Number</label>
            <input v-model="formData.licenseNumber" id="licenseNumber" type="text" placeholder="Enter your license number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label for="experience" class="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <input v-model.number="formData.experience" id="experience" type="number" placeholder="Enter years of experience" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
        <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-70">
          {{ loading ? 'Registering...' : 'Sign Up' }}
        </button>
      </form>
      <p class="text-center text-gray-600 mt-6">
        Already have an account?
        <router-link to="/login" class="text-blue-500 font-semibold hover:underline">Login here</router-link>
      </p>
    </div>
  </div>
</template>
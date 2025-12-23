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
      <h1 class="login-title">LawConnect - Sign Up</h1>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="form-group">
          <label for="name" class="form-label">Full Name</label>
          <input v-model="formData.name" id="name" type="text" placeholder="Enter your full name" required class="form-input" />
        </div>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input v-model="formData.email" id="email" type="email" placeholder="Enter your email" required class="form-input" />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input v-model="formData.password" id="password" type="password" placeholder="Enter your password" required class="form-input" />
        </div>
        <div class="form-group">
          <label for="phone" class="form-label">Phone</label>
          <input v-model="formData.phone" id="phone" type="tel" placeholder="Enter your phone number" class="form-input" />
        </div>
        <div class="form-group">
          <label for="role" class="form-label">Role</label>
          <select v-model="formData.role" id="role" class="form-input">
            <option value="client">Client</option>
            <option value="lawyer">Lawyer</option>
          </select>
        </div>
        <div v-if="formData.role === 'lawyer'" class="lawyer-fields">
          <div class="form-group">
            <label for="specialization" class="form-label">Specialization</label>
            <input v-model="formData.specialization" id="specialization" type="text" placeholder="e.g., Corporate Law" class="form-input" />
          </div>
          <div class="form-group">
            <label for="licenseNumber" class="form-label">License Number</label>
            <input v-model="formData.licenseNumber" id="licenseNumber" type="text" placeholder="Enter your license number" class="form-input" />
          </div>
          <div class="form-group">
            <label for="experience" class="form-label">Years of Experience</label>
            <input v-model.number="formData.experience" id="experience" type="number" placeholder="Enter years of experience" class="form-input" />
          </div>
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Registering...' : 'Sign Up' }}
        </button>
      </form>
      <p class="signup-link">
        Already have an account?
        <router-link to="/login" class="signup-link-text">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Lawyer fields */
.lawyer-fields {
  padding: 1rem;
  background-color: #eff6ff;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

/* Error message */
.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: -0.5rem;
}

/* Form spacing */
.space-y-4 {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
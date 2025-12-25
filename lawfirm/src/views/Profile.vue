<!-- src/views/Profile.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

let user = ref(null);
let loading = ref(false);
let updating = ref(false);
let error = ref('');
let success = ref('');

let name = ref('');
let email = ref('');
let phone = ref('');
let specialization = ref('');
let licenseNumber = ref('');
let experience = ref('');

let currentPassword = ref('');
let newPassword = ref('');
let confirmPassword = ref('');
let changingPassword = ref(false);
let passwordError = ref('');
let passwordSuccess = ref('');

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/');
};

onMounted(() => {
  getProfile();
});

const getProfile = () => {
  loading.value = true;
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        user.value = data.data.user;
        name.value = user.value.name;
        email.value = user.value.email;
        phone.value = user.value.phone || '';
        specialization.value = user.value.specialization || '';
        licenseNumber.value = user.value.licenseNumber || '';
        experience.value = user.value.experience?.toString() || '';
      }
      loading.value = false;
    })
    .catch((err) => {
      console.error('Failed to fetch profile:', err);
      loading.value = false;
      router.push('/login');
    });
};

const updateProfile = () => {
  updating.value = true;
  error.value = '';
  success.value = '';
  const token = localStorage.getItem('token');

  const updateData = {
    name: name.value.trim(),
    phone: phone.value.trim() || null
  };

  if (user.value.role === 'lawyer') {
    updateData.specialization = specialization.value.trim() || null;
    updateData.licenseNumber = licenseNumber.value.trim() || null;
    const expNum = parseInt(experience.value);
    updateData.experience = isNaN(expNum) ? null : expNum;
  }

  fetch('http://localhost:5000/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        user.value = data.data.user;
        localStorage.setItem('user', JSON.stringify(data.data.user));
        success.value = 'Profile updated successfully!';
      } else {
        error.value = data.message || 'Failed to update profile';
      }
      updating.value = false;
    })
    .catch((err) => {
      error.value = 'Failed to update profile. Please try again.';
      updating.value = false;
    });
};

const changePassword = () => {
  changingPassword.value = true;
  passwordError.value = '';
  passwordSuccess.value = '';

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match';
    changingPassword.value = false;
    return;
  }

  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/auth/change-password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        passwordSuccess.value = 'Password changed successfully!';
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
      } else {
        passwordError.value = data.message || 'Failed to change password';
      }
      changingPassword.value = false;
    })
    .catch((err) => {
      passwordError.value = 'Failed to change password. Please try again.';
      changingPassword.value = false;
    });
};
</script>

<template>
  <div class="dashboard-container">
    <div class="container">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading profile...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Information -->
        <div class="card">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {{ success }}
          </div>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                v-model="name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                v-model="email"
                type="email"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
              <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                v-model="phone"
                type="tel"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                :value="user?.role"
                type="text"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 capitalize"
              />
            </div>

            <!-- Lawyer-specific fields -->
            <div v-if="user?.role === 'lawyer'" class="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  v-model="specialization"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  v-model="licenseNumber"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  v-model="experience"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <!--  YELLOW TEXT: Update Profile button -->
            <button
              type="submit"
              :disabled="updating"
              class="w-full py-3 bg-blue-600 text-yellow-400 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {{ updating ? 'Updating...' : 'Update Profile' }}
            </button>
          </form>
        </div>

        <!-- Change Password -->
        <div class="card">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

          <div v-if="passwordError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {{ passwordSuccess }}
          </div>

          <form @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                v-model="currentPassword"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                v-model="newPassword"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                v-model="confirmPassword"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <!--  YELLOW TEXT: Change Password button -->
            <button
              type="submit"
              :disabled="changingPassword"
              class="w-full py-3 bg-blue-600 text-yellow-400 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </div>

        <!-- Logout Button -->
        <div class="card" style="background-color: #fef2f2; border: 1px solid #fecaca;">
          <h2 class="text-xl font-bold text-red-800 mb-4">Account Management</h2>
          <!--  YELLOW TEXT: Logout button -->
          <button 
            @click="logout" 
            class="w-full py-3 bg-red-600 text-yellow-400 rounded-lg font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
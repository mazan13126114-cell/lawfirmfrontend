<!-- src/App.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const showUserMenu = ref(false);

// ✅ Show navbar for all authenticated users EXCEPT on login/register pages
const showNavbar = computed(() => {
  if (!user.value) return false;
  
  // Hide navbar on public pages only
  const publicPages = ['/', '/register', '/logout'];
  return !publicPages.includes(route.path);
});

const userInitials = computed(() => {
  if (!user.value?.name) return '?';
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem('user');
    }
  }
});

// Watch route changes to update user and navbar
watch(() => route.path, () => {
  // Always sync user from localStorage on route change
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      user.value = null;
    }
  } else {
    user.value = null;
  }
  
  // Auto-redirect logged-in users from login page
  if (user.value && route.path === '/') {
    if (user.value.role === 'admin') router.push('/admin');
    else if (user.value.role === 'lawyer') router.push('/dashboard/lawyer');
    else router.push('/dashboard/client');
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ✅ Navbar ONLY for client/lawyer on their dashboard routes -->
    <nav v-if="showNavbar" class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <!-- Logo -->
          <div class="flex items-center">
            <router-link to="/dashboard" class="text-2xl font-bold text-blue-600">
              ⚖️ LawConnect
            </router-link>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link to="/dashboard" class="text-gray-700 hover:text-blue-600 font-medium">
              Dashboard
            </router-link>
            <router-link to="/cases" class="text-gray-700 hover:text-blue-600 font-medium">
              Cases
            </router-link>
            <router-link to="/messages" class="text-gray-700 hover:text-blue-600 font-medium">
              Messages
            </router-link>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button @click="showUserMenu = !showUserMenu" class="focus:outline-none">
              <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {{ userInitials }}
              </div>
            </button>

            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
              <router-link
                to="/profile"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                @click="showUserMenu = false"
              >
                Profile
              </router-link>
              <button
                @click="logout"
                class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main :class="{ 'pt-16': showNavbar, 'pt-0': !showNavbar }">
      <router-view />
    </main>
  </div>
</template>

<script>
// Add logout method outside script setup
export default {
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/');
    }
  }
}
</script>
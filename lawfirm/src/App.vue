<!-- src/App.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const showUserMenu = ref(false);

const showNavbar = computed(() => {
  if (!user.value) return false;
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

watch(() => route.path, () => {
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
  
  if (user.value && route.path === '/') {
    if (user.value.role === 'admin') router.push('/admin');
    else if (user.value.role === 'lawyer') router.push('/dashboard/lawyer');
    else router.push('/dashboard/client');
  }
});
</script>

<template>
  <div class="dashboard-container">
    <nav v-if="showNavbar" class="navbar">
      <div class="navbar-content">
        <div>
          <router-link to="/dashboard" class="navbar-brand">
            ⚖️ LawConnect
          </router-link>
        </div>

        <div class="nav-links">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/cases" class="nav-link">Cases</router-link>
          <router-link to="/messages" class="nav-link">Messages</router-link>
        </div>

        <div class="user-menu">
          <div class="user-avatar">{{ userInitials }}</div>
          <div v-if="showUserMenu" class="user-dropdown">
            <router-link to="/profile" class="dropdown-item" @click="showUserMenu = false">
              Profile
            </router-link>
            <button @click="logout" class="dropdown-item" style="border: none; background: none; text-align: left; cursor: pointer;">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main :class="{ 'main-content-padded': showNavbar }">
      <router-view />
    </main>
  </div>
</template>

<script>
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
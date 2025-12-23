<!-- src/views/Logout.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Logging out...</h1>
      <p class="text-gray-600">Clearing your session...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login after 1 second
  setTimeout(() => {
    router.push('/');
  }, 1000);
});
</script>
<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-lg text-center">
      <h1 class="text-2xl font-bold mb-4">Logging out...</h1>
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

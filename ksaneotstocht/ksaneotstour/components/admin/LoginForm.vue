<template>
    <div class="formsman w-full max-w-xs p-6 bg-gray-800 rounded shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-brand-yellow">Super Swaggy Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4 w-auto">
          <label for="password" class="block text-gray-400 text-sm font-bold mb-2">De super secret code:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="shadow border rounded w-90% py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-brand-yellow"
            :class="{ 'border-red-500': !!loginError }"
          />
        </div>
        <div v-if="loginError" class="mb-4 text-red-500 text-xs italic">
          {{ loginError }}
        </div>
        <div class="flex items-center justify-between">
          <BaseButton type="submit" :disabled="loading" variant="primary">
            {{ loading ? 'Inloggen...' : 'Login' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import BaseButton from '~/components/UI/BaseButton.vue';
  // Importeer store of composable
  // Voorbeeld met Pinia (maak store/auth.ts aan)
  import { useAuthStore } from '~/store/auth';
  
  const authStore = useAuthStore();
  const router = useRouter();
  
  const password = ref('');
  const loading = ref(false);
  const loginError = ref<string | null>(null);
  
  async function handleLogin() {
    loading.value = true;
    loginError.value = null;
    try {
      await authStore.login(password.value); // Roep Pinia action aan
      // Navigeer naar admin stops pagina bij succes
       if (authStore.isAdmin) {
         await router.push('/admin/stops');
       } else {
         // Dit zou niet mogen gebeuren als login geen error gooit
         loginError.value = 'Onbekende fout na login.';
       }
    } catch (error: any) {
      console.error('Login error:', error);
      loginError.value = error.data?.message || error.message || 'Login mislukt. Controleer wachtwoord.';
    } finally {
      loading.value = false;
    }
  }
  </script>
  <style scoped>
  .formsman {
    font-family: 'Poppins', sans-serif;

  }
  
  </style>
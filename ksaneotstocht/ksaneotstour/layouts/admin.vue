<template>
  <div class="min-h-screen bg-gray-900 text-gray-200 flex flex-col"> <header class="bg-gray-800 shadow-lg sticky top-0 z-10"> <div class="mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
        <NuxtLink to="/admin/stops" class="text-xl font-bold text-brand-yellow hover:text-yellow-300">
          Admin - Dorpstour
        </NuxtLink>
        <nav class="space-x-4 mt-2 sm:mt-0">
          <NuxtLink
             to="/admin/stops"
             class="px-3 py-2 rounded hover:bg-gray-700"
             active-class="text-brand-yellow bg-gray-700 font-semibold"
             >Stops Beheren</NuxtLink>
          <BaseButton size="sm" variant="danger" @click="handleLogout">
            Uitloggen
          </BaseButton>
        </nav>
      </div>
    </header>
    <main class="container margins mx-auto flex-grow"> <slot /> </main>
    <footer class="bg-gray-800 text-center text-xs text-gray-500 p-2 mt-auto"> Dorpstour Admin Panel
    </footer>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '~/components/UI/BaseButton.vue';
const router = useRouter();

async function handleLogout() {
  console.log("Uitloggen...");
  try {
    await $fetch('/api/admin/auth', { method: 'DELETE' });
    await router.push('/admin');
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
</script>

<style scoped>
h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
}
h2 {
  font-family: 'Poppins', sans-serif;
}
a {
  font-family: 'Poppins', sans-serif;
}
p {
  font-family: 'Poppins', sans-serif;
}
.margins {
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
<template>
  <main class="w-full overflow-x-hidden">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// Jouw code om dark mode standaard aan te zetten
onMounted(() => {
  if (process.client) { // Zorg dat dit alleen client-side draait
     document.documentElement.classList.add('dark')
  }
})
</script>

<style>
/* Globale stijlen die niet per se in assets/css/main.css hoeven */
html.dark {
  color-scheme: dark; /* Hint voor browser UI zoals scrollbars in dark mode */
}

/* Zorg dat de body geen onverwachte marges heeft */
body {
  overflow-x: hidden;
  margin: 0;
  padding: 0;
  font-family: theme('fontFamily.sans');
}
</style>
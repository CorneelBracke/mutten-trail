<template>
  <div>
    <h1 class="text-3xl font-bold text-center my-4 mx-4 text-brand-yellow">
      KSA en NEOTS Dorpstour
    </h1>
    <ScoreboardWidget />
    <div class="container mx-auto px-4 relative">
      <MapDisplay :stops="activeStops" :key="mapKey" />

      <div v-if="pending && !activeStops?.length" class="text-center py-4 text-gray-400">Initiële stops laden...</div>
      <div v-if="error" class="text-center py-4 text-red-500">
        Kon stops niet laden: {{ error.message }}
      </div>
       <div v-if="!pending && activeStops?.length === 0" class="text-center py-4 text-gray-400">
         Momenteel geen actieve stops. De kaart wordt elke minuut bijgewerkt.
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MapDisplay from '~/components/MapDisplay.vue';
import type { Stop } from '~/types';
import ScoreboardWidget from '~/components/ScoreboardWidget.vue';

// Metadata voor de pagina
useHead({
  title: 'Dorpstour Kaart',
})

// Interval timer ID
let pollingInterval: NodeJS.Timeout | null = null;
const POLLING_INTERVAL_MS = 60 * 1000; // Poll elke 60 seconden (pas aan indien nodig)

// Key om MapDisplay her-rendering te forceren indien nodig (optioneel)
const mapKey = ref(0);

// Data fetching met useFetch
const { data: activeStops, pending, error, refresh } = await useFetch<Stop[]>('/api/stops/active', {
  default: () => [],
  // lazy: true, // Je kunt lazy: true gebruiken en de pending state beter tonen
});

// Functie om stops te verversen en eventueel map te updaten
async function refreshStops() {
   console.log(`[${new Date().toISOString()}] Polling for active stops...`);
   try {
       await refresh(); // Voer de useFetch refresh uit
       console.log(`[${new Date().toISOString()}] Fetched stops:`, activeStops.value?.length ?? 0);
       // Forceer map update indien nodig (meestal niet nodig als MapDisplay goed reageert op prop changes)
       // mapKey.value++;
   } catch (refreshError) {
       console.error("Error during stop refresh:", refreshError);
       // Toon eventueel een subtiele foutmelding aan de gebruiker
   }
}

// Start polling wanneer de component gemount is (client-side)
onMounted(() => {
  if (process.client) {
    console.log("Starting stop polling interval...");
    // Clear eventueel bestaande interval voor zekerheid
    if (pollingInterval) clearInterval(pollingInterval);
    // Start nieuwe interval
    pollingInterval = setInterval(refreshStops, POLLING_INTERVAL_MS);
  }
});

// Stop polling wanneer de component unmounted wordt
onUnmounted(() => {
  if (pollingInterval) {
    console.log("Stopping stop polling interval.");
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
});

</script>
  <style scoped>
  /* Scoped styles for this component */
  /* The h1 font and styling */
  h1 {
    font-family: 'Poppins', sans-serif;
    font-size: 2rem;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  </style>
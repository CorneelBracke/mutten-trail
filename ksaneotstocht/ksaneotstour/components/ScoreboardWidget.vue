<template>
    <div class="fixed top-4 right-4 z-10 max-w-xs w-[calc(100%-2rem)] sm:w-auto text-xs">
      <div class="bg-gray-800 bg-opacity-80 backdrop-blur-sm text-gray-200 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div class="flex justify-between items-center p-2 border-b border-gray-700 cursor-pointer" @click="toggleExpand">
          <h3 class="font-semibold text-sm text-brand-yellow">Scorebord</h3>
          <button class="text-gray-400 hover:text-white">
             <span v-if="isExpanded" class="i-mdi-chevron-up w-4 h-4"></span>
            <span v-else class="i-mdi-chevron-down w-4 h-4"></span>
          </button>
        </div>
  
        <div v-if="isExpanded" class="p-2 max-h-60 overflow-y-auto">
          <div v-if="pending" class="py-4 text-center text-gray-400">Laden...</div>
          <div v-else-if="error" class="py-4 text-center text-red-400">Fout: {{ error.message }}</div>
          <div v-else-if="!scores || scores.length === 0" class="py-4 text-center text-gray-400">Geen scores.</div>
          <ul v-else class="space-y-1">
            <li v-for="(entry, index) in scores" :key="entry.id" class="flex justify-between items-center text-xs">
              <span class="truncate">
                <span class="text-gray-500 mr-1">{{ index + 1 }}.</span>
                <span class="font-medium text-gray-100">{{ entry.group_name }}</span>
              </span>
              <span class="font-bold text-brand-yellow ml-2 shrink-0">{{ entry.score }}</span>
            </li>
          </ul>
           <BaseButton @click="refresh" :disabled="pending" class="mt-2 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 w-full text-center">
               <span v-if="pending" class="i-mdi-loading animate-spin w-3 h-3 mr-1"></span>
               {{ pending ? 'Verversen...' : 'Verversen' }}
           </BaseButton>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import type { ScoreboardEntry } from '~/types';
import BaseButton from './UI/BaseButton.vue';
  
  // State voor inklappen
  const isExpanded = ref(false); // Start ingeklapt op mobiel
  
  function toggleExpand() {
    isExpanded.value = !isExpanded.value;
  }
  
  // Fetch data (kan ook via Pinia store)
  const { data: scores, pending, error, refresh } = useFetch<ScoreboardEntry[]>('/api/scoreboard', {
    default: () => [],
    lazy: true, // Laad data op achtergrond
  });
  
  // Optioneel: Periodiek refreshen van de widget data
  let intervalId: NodeJS.Timeout | null = null;
  onMounted(() => {
     // Start ingeklapt, maar als het scherm breder is, start uitgeklapt
      if (process.client && window.innerWidth >= 640) { // sm breakpoint
         isExpanded.value = true;
      }
     // Start interval (bv. elke 2 minuten)
     if (process.client) {
        intervalId = setInterval(() => {
           console.log("Refreshing scoreboard widget...");
           refresh();
        }, 2 * 60 * 1000);
     }
  });
  onUnmounted(() => {
     if (intervalId) clearInterval(intervalId);
  });
  
  </script>
  
  <style scoped>
  /* Custom scrollbar styling (optioneel) */
  .max-h-60::-webkit-scrollbar {
    width: 4px;
  }
  .max-h-60::-webkit-scrollbar-track {
    background: transparent;
  }
  .max-h-60::-webkit-scrollbar-thumb {
    background-color: #4a5568; /* gray-700 */
    border-radius: 20px;
    border: 3px solid transparent;
  }
  </style>
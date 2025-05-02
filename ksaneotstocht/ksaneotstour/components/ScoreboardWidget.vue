<template>
    <div class="fixed bottom-4 right-4 z-20 max-w-xs w-[calc(100%-2rem)] sm:w-64 text-sm m-4">
      <div class="bg-gray-800 bg-opacity-85 backdrop-blur-md text-gray-200 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <button
          @click="toggleExpand"
          class="w-full flex justify-between items-center p-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-yellow rounded-t-lg"
          :class="isExpanded ? 'border-b border-gray-700' : ''"
          aria-label="Toggle scoreboard"
          :aria-expanded="isExpanded"
        >
          <h3 class="font-semibold text-brand-yellow flex items-center">
             <span class="i-mdi-format-list-numbered w-5 h-5 mr-2"></span> Scorebord
           </h3>
          <span v-if="isExpanded" class="i-mdi-close w-5 h-5 text-gray-400 hover:text-white"></span>
          <span v-else class="i-mdi-chevron-down w-5 h-5 text-gray-400 hover:text-white"></span> </button>
  
        <div v-show="isExpanded" class="p-3 max-h-60 overflow-y-auto">
          <div v-if="pending" class="py-4 text-center text-gray-400 text-xs">Laden...</div>
          <div v-else-if="error" class="py-4 text-center text-red-400 text-xs">Fout: {{ error.message }}</div>
          <div v-else-if="!scores || scores.length === 0" class="py-4 text-center text-gray-400 text-xs">Geen scores.</div>
          <ul v-else class="space-y-1.5">
            <li v-for="(entry, index) in scores" :key="entry.id" class="flex items-center justify-between text-xs">
               <div class="flex items-baseline space-x-2 truncate mr-2">
                   <span class="font-bold text-center w-5 shrink-0" :class="getRankColor(index)">{{ index + 1 }}.</span>
                   <span class="font-medium text-gray-100 truncate">{{ entry.group_name }}</span>
               </div>
               <span class="font-bold text-brand-yellow ml-2 shrink-0">{{ entry.score }}</span>
            </li>
          </ul>
           <BaseButton @click="refresh" :disabled="pending" class="mt-3 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 w-full flex items-center justify-center">
               <span v-if="pending" class="i-mdi-loading animate-spin w-3 h-3 mr-1"></span>
               {{ pending ? 'Refreshing...' : 'Refresh' }}
           </BaseButton>
        </div>
      </div>
    </div>
  </template>
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import type { ScoreboardEntry } from '~/types';
  
  // Start standaard ingeklapt
  const isExpanded = ref(false);
  
  function toggleExpand() {
    isExpanded.value = !isExpanded.value;
  }
  
  // Fetch data
  const { data: scores, pending, error, refresh } = useFetch<ScoreboardEntry[]>('/api/scoreboard', {
    default: () => [],
    lazy: true,
  });
  
  // Periodiek refreshen
  let intervalId: NodeJS.Timeout | null = null;
  onMounted(() => {
     // Start NIET uitgeklapt op desktop, gebruiker moet klikken
     // if (process.client && window.innerWidth >= 640) { isExpanded.value = true; }
  
     if (process.client) {
        intervalId = setInterval(() => { refresh(); }, 2 * 60 * 1000);
     }
  });
  onUnmounted(() => { if (intervalId) clearInterval(intervalId); });
  
  // Helper voor rank kleur (optioneel)
  function getRankColor(index: number): string {
      if (index === 0) return 'text-yellow-400';
      if (index === 1) return 'text-gray-400';
      if (index === 2) return 'text-orange-400';
      return 'text-gray-500';
  }
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
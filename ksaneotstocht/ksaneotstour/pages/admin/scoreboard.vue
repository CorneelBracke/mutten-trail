<template>
    <div>
      <h2 class="text-2xl md:text-3xl font-semibold mb-6 text-brand-yellow">Scoreboard Beheer</h2>
  
      <form @submit.prevent="handleSaveScore" class="bg-gray-800 p-4 rounded-lg shadow-lg mb-6 max-w-md">
        <h3 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Score Toevoegen/Bijwerken</h3>
        <div class="space-y-4">
          <div>
            <label for="group_name" class="block text-sm font-medium text-gray-400 mb-1">Groepsnaam</label>
            <input
              type="text" id="group_name" v-model="form.group_name" required
              class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm"
            />
          </div>
          <div>
            <label for="score" class="block text-sm font-medium text-gray-400 mb-1">Score</label>
            <input
               type="number" step="1" id="score" v-model.number="form.score" required
               class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm"
             />
          </div>
          <div v-if="formError" class="text-red-400 text-sm">
              {{ formError }}
          </div>
          <div class="text-right">
              <BaseButton type="submit" variant="primary" :disabled="loadingSubmit">
                   {{ loadingSubmit ? 'Opslaan...' : 'Score Opslaan' }}
              </BaseButton>
          </div>
        </div>
      </form>
  
      <div>
          <h3 class="text-xl font-semibold mb-4 text-gray-300">Huidige Stand</h3>
          <div v-if="loadingScores" class="text-center py-6 text-gray-400">Scores laden...</div>
          <div v-else-if="fetchError" class="p-4 bg-red-900 border border-red-700 rounded text-red-200">
            Kon scores niet laden: {{ fetchError.message }}
          </div>
           <div v-else-if="!scores || scores.length === 0" class="text-center py-6 text-gray-400">Nog geen scores ingevoerd.</div>
          <ul v-else class="space-y-2 max-w-md">
              <li v-for="(entry, index) in scores" :key="entry.id" class="flex justify-between items-center bg-gray-800 px-4 py-2 rounded shadow">
                  <span class="font-semibold">
                     <span class="text-gray-500 mr-2">{{ index + 1 }}.</span>
                     <span class="text-brand-yellow">{{ entry.group_name }}</span>
                   </span>
                  <span class="text-lg font-bold">{{ entry.score }}</span>
                  </li>
          </ul>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive } from 'vue';
  import BaseButton from '~/components/UI/BaseButton.vue';
  import type { ScoreboardEntry } from '~/types'; // Definieer dit type!
  
  definePageMeta({
    layout: 'admin',
    middleware: 'auth'
  });
  
  useHead({ title: 'Admin - Scoreboard' })
  
  // State voor formulier
  const form = reactive({
    group_name: '',
    score: 0 as number | null, // Start met null of 0
  });
  const loadingSubmit = ref(false);
  const formError = ref<string | null>(null);
  
  // State voor scorelijst
  const { data: scores, pending: loadingScores, error: fetchError, refresh } = await useFetch<ScoreboardEntry[]>('/api/scoreboard', {
    default: () => [],
    lazy: false, // Wacht op data voor weergave
  });
  
  // Methode om score op te slaan (upsert)
  async function handleSaveScore() {
    loadingSubmit.value = true;
    formError.value = null;
  
    // Basis check of score een nummer is
    if (typeof form.score !== 'number') {
        formError.value = 'Score moet een getal zijn.';
        loadingSubmit.value = false;
        return;
    }
  
  
    try {
      await $fetch('/api/admin/scoreboard', {
        method: 'POST',
        body: {
          group_name: form.group_name,
          score: form.score, // Stuur als nummer
        }
      });
      // Reset formulier en herlaad lijst
      form.group_name = '';
      form.score = 0;
      await refresh(); // Herlaad de scorelijst
    } catch (error: any) {
      console.error("Error saving score:", error);
      formError.value = error.data?.message || 'Kon score niet opslaan.';
    } finally {
      loadingSubmit.value = false;
    }
  }
  
  // Optioneel: Delete functie (als je DELETE API toevoegt)
  // async function handleDelete(id: number) { ... }
  
  </script>
<template>
    <div>
        <h2 class="text-2xl md:text-3xl font-semibold mb-6 text-brand-yellow">Scoreboard Beheer</h2>

        <form @submit.prevent="handleSaveScore"
            class="bg-gray-800 p-4 rounded-lg shadow-lg mb-6 max-w-md overflow-hidden">
            <h3 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Score Toevoegen/Bijwerken</h3>
            <div class="space-y-4">
                <div>
                    <label for="group_name" class="block text-sm font-medium text-gray-400 mb-1">Groepsnaam</label>
                    <input type="text" id="group_name" v-model="form.group_name" required
                        class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm" />
                </div>
                <div>
                    <label for="score" class="block text-sm font-medium text-gray-400 mb-1">Score</label>
                    <input type="number" step="1" id="score" v-model.number="form.score" required
                        class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm" />
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

        <div class="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-4 text-gray-300">Huidige Stand</h3>
            <div v-if="loadingScores" class="text-center py-6 text-gray-400">Scores laden...</div>
            <div v-else-if="fetchError" class="p-4 bg-red-900 border border-red-700 rounded text-red-200">
                Kon scores niet laden: {{ fetchError.message }}
            </div>
            <div v-else-if="!scores || scores.length === 0" class="text-center py-6 text-gray-400">Nog geen scores
                ingevoerd.</div>
            <ul v-else class="space-y-2">
                <li v-for="(entry, index) in scores" :key="entry.id"
                    class="flex flex-wrap justify-between items-center bg-gray-900 px-3 py-2 rounded shadow-sm gap-2">
                    <div class="flex items-center space-x-3 mr-4">
                        <span class="text-lg text-center w-6 shrink-0" :class="getRankPillColor(index)">{{ index + 1
                            }}</span>
                        <span class="font-semibold text-gray-100 truncate">{{ entry.group_name }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <BaseButton size="sm" variant="secondary" @click="changeScore(entry, -1)"
                            :disabled="entry.score === 0 || loadingStates[entry.id]"> - </BaseButton>
                        <span class="text-lg font-bold w-8 text-center">{{ entry.score }}</span>
                        <BaseButton size="sm" variant="secondary" @click="changeScore(entry, 1)"
                            :disabled="loadingStates[entry.id]"> + </BaseButton>
                        <BaseButton size="sm" variant="danger" @click="handleDelete(entry.id)"
                            :disabled="loadingStates[entry.id]" class="ml-2" aria-label="Verwijder">
                            <span class="i-mdi-delete w-4 h-4"></span>
                        </BaseButton>
                    </div>
                    <div v-if="loadingStates[entry.id]" class="w-full text-center text-xs text-gray-400 pt-1">Bezig...
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import BaseButton from '~/components/UI/BaseButton.vue';
import type { ScoreboardEntry } from '~/types';

definePageMeta({ layout: 'admin', middleware: 'auth' });
useHead({ title: 'Admin - Scoreboard' });

const form = reactive({ group_name: '', score: 0 as number | null });
const loadingSubmit = ref(false);
const formError = ref<string | null>(null);
const loadingStates = reactive<Record<number, boolean>>({});

const { data: scores, pending: loadingScores, error: fetchError, refresh } = await useFetch<ScoreboardEntry[]>('/api/scoreboard', {
    default: () => [],
    lazy: false,
});

async function handleSaveScore() { loadingSubmit.value = true; formError.value = null; if (typeof form.score !== 'number') { formError.value = 'Score moet een getal zijn.'; loadingSubmit.value = false; return; } try { await $fetch('/api/admin/scoreboard', { method: 'POST', body: { group_name: form.group_name, score: form.score } }); form.group_name = ''; form.score = 0; await refresh(); } catch (error: any) { console.error("Error saving score:", error); formError.value = error.data?.message || 'Kon score niet opslaan.'; } finally { loadingSubmit.value = false; } }
async function changeScore(entry: ScoreboardEntry, change: number) { if (loadingStates[entry.id]) return; loadingStates[entry.id] = true; const newScore = (entry.score ?? 0) + change; if (newScore < 0) { console.warn("Score can't be negative"); loadingStates[entry.id] = false; return; } console.log(`Changing score for ID ${entry.id} to ${newScore}`); try { await $fetch(`/api/admin/scoreboard/${entry.id}`, { method: 'PATCH', body: { score: newScore } }); await refresh(); } catch (error: any) { console.error(`Error changing score for ${entry.id}:`, error); alert(`Kon score niet aanpassen: ${error.data?.message || 'Serverfout'}`); } finally { loadingStates[entry.id] = false; } }
async function handleDelete(id: number) { if (loadingStates[id]) return; if (!confirm(`Weet je zeker dat je score entry #${id} wilt verwijderen?`)) return; loadingStates[id] = true; console.log('Deleting score entry:', id); try { await $fetch(`/api/admin/scoreboard/${id}`, { method: 'DELETE' }); await refresh(); } catch (error: any) { console.error("Delete failed:", error); alert(`Kon score entry niet verwijderen: ${error.data?.message || 'Serverfout'}`); } finally { delete loadingStates[id]; } }

// Helper voor rank kleur (met achtergrond 'pill')
function getRankPillColor(index: number): string {
    if (index === 0) return 'text-yellow font-bold px-1 rounded'; // Goud
    if (index === 1) return 'text-gray font-bold px-1 rounded'; // Zilver
    if (index === 2) return 'text-orange font-bold px-1 rounded'; // Brons
    return 'text-gray-600 bg-white font-semibold px-1 rounded'; // Andere ranks
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

h3 {
    font-family: 'Poppins', sans-serif;
}

a {
    font-family: 'Poppins', sans-serif;
}

p {
    font-family: 'Poppins', sans-serif;
}

label {
    font-family: 'Poppins', sans-serif;
}
</style>
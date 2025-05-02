<template>
    <template v-if="shouldShowWidget">
        <div class="fixed bottom-4 right-4 z-30 w-[calc(100%-2rem)] max-w-[260px] text-xs">
            <div
                class="bg-gray-800 bg-opacity-90 backdrop-blur-md text-gray-200 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                <button @click="toggleExpand"
                    class="w-full flex justify-between items-center p-1.5 text-left focus:outline-none focus:ring-2 focus:ring-brand-yellow rounded-t-lg"
                    :class="isExpanded ? 'border-b border-gray-700' : ''" aria-label="Toggle scoreboard"
                    :aria-expanded="isExpanded">
                    <h3 class="font-semibold text-sm text-brand-yellow flex items-center">
                        <span v-if="!isExpanded" class="i-mdi-format-list-numbered w-5 h-5 mr-1.5"></span>
                        <span v-else class="i-mdi-podium w-5 h-5 mr-1.5"></span>
                        Scorebord
                    </h3>
                    <span v-if="isExpanded" class="i-mdi-close w-5 h-5 text-gray-400 hover:text-white"></span>
                    <span v-else class="i-mdi-chevron-down w-5 h-5 text-gray-400 hover:text-white"></span>
                </button>

                <div v-show="isExpanded" class="p-2 max-h-48 sm:max-h-60 overflow-y-auto">
                    <ul class="space-y-1">
                        <li v-for="(entry, index) in scores" :key="entry.id"
                            class="flex items-center justify-between text-xs">
                            <div class="flex items-baseline space-x-1.5 truncate mr-2">
                                <span :class="getRankPillColor(index)">{{ index + 1 }}</span>
                                <span class="font-medium text-gray-100 truncate">{{ entry.group_name }}</span>
                            </div>
                            <span class="font-bold text-base text-brand-yellow ml-2 shrink-0">{{ entry.score }}</span>
                        </li>
                    </ul>
                    <button @click="() => refresh()" :disabled="pending"
                        class="mt-3 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 w-full flex items-center justify-center">
                        <span v-if="pending" class="i-mdi-loading animate-spin w-3 h-3 mr-1"></span>
                        {{ pending ? 'Verversen...' : 'Verversen' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
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

// Computed property om te bepalen of de widget überhaupt getoond moet worden
const shouldShowWidget = computed(() => {
    return scores.value && scores.value.length > 0;
})


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


function getRankPillColor(index: number): string {
    if (index === 0) return 'text-yellow font-bold px-1 rounded'; // Goud
    if (index === 1) return 'text-gray font-bold px-1 rounded'; // Zilver
    if (index === 2) return 'text-orange font-bold px-1 rounded'; // Brons
    return 'text-gray-600 bg-white font-semibold px-1 rounded'; // Andere ranks
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
    background-color: #4a5568;
    /* gray-700 */
    border-radius: 20px;
    border: 3px solid transparent;
}

.max-h-48::-webkit-scrollbar,
.max-h-60::-webkit-scrollbar {
    width: 4px;
}

.max-h-48::-webkit-scrollbar-track,
.max-h-60::-webkit-scrollbar-track {
    background: transparent;
}

.max-h-48::-webkit-scrollbar-thumb,
.max-h-60::-webkit-scrollbar-thumb {
    background-color: #4a5568;
    border-radius: 20px;
    border: 3px solid transparent;
}

[class^="i-mdi-"] {
    min-width: 1em;
    min-height: 1em;
}
</style>
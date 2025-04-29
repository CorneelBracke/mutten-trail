<template>
  <div class="space-y-3 lg:hidden">
      <div v-if="!stops || stops.length === 0" class="text-center py-4 text-gray-400">Geen stops gevonden.</div>
      <div v-for="stop in stops" :key="stop.id" class="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
          <div class="flex justify-between items-center mb-2">
              <h4 class="font-semibold text-lg text-brand-yellow">#{{ stop.id }} {{ stop.name }}</h4>
              <span class="inline-block w-4 h-4 rounded border border-black" :style="{ backgroundColor: stop.color || '#000000' }"></span>
          </div>
          <p class="text-sm text-gray-400 mb-1">
              <span :class="stop.is_manually_disabled ? 'text-red-400' : 'text-green-400'">
                  {{ stop.is_manually_disabled ? 'Manueel Uitgeschakeld' : 'Actief (indien binnen tijd)' }}
              </span>
          </p>
          <p class="text-xs text-gray-500">Start: {{ formatDateTime(stop.start_time) }}</p>
          <p class="text-xs text-gray-500 mb-3">Einde: {{ formatDateTime(stop.end_time) }}</p>
          <div class="flex justify-end space-x-2 mt-2 border-t border-gray-700 pt-3">
              <BaseButton size="sm" variant="secondary" @click="$emit('toggle', stop)">
                {{ stop.is_manually_disabled ? 'Activeer' : 'Deactiveer' }}
              </BaseButton>
              <BaseButton size="sm" variant="secondary" @click="$emit('edit', stop)">
                Bewerk
              </BaseButton>
              <BaseButton size="sm" variant="danger" @click="$emit('delete', stop.id)">
                Verwijder
              </BaseButton>
          </div>
      </div>
  </div>

  <div class="hidden lg:block overflow-x-auto bg-gray-800 rounded-lg shadow border border-gray-700">
    <table class="min-w-full table-auto">
      <thead class="bg-gray-900">
        <tr>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">ID</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Naam</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Status</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Start</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Einde</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Kleur</th>
          <th class="px-3 py-2 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider">Acties</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-700">
        <tr v-if="!stops || stops.length === 0">
          <td colspan="7" class="text-center py-4 text-gray-400">Geen stops gevonden.</td>
        </tr>
        <tr v-for="stop in stops" :key="stop.id" class="hover:bg-gray-700">
          <td class="px-3 py-2 whitespace-nowrap text-sm">{{ stop.id }}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm font-medium">{{ stop.name }}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm">
            <span :class="stop.is_manually_disabled ? 'text-red-400' : 'text-green-400'">
              {{ stop.is_manually_disabled ? 'Man. Uit' : 'Actief' }}
            </span>
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{{ formatDateTime(stop.start_time) }}</td>
          <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{{ formatDateTime(stop.end_time) }}</td>
          <td class="px-3 py-2 whitespace-nowrap">
             <span class="inline-block w-4 h-4 rounded border border-black" :style="{ backgroundColor: stop.color || '#000000' }"></span>
           </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm space-x-1">
            <BaseButton size="sm" variant="secondary" @click="$emit('toggle', stop)">
              {{ stop.is_manually_disabled ? 'Aan' : 'Uit' }}
            </BaseButton>
            <BaseButton size="sm" variant="secondary" @click="$emit('edit', stop)">
              Edit
            </BaseButton>
            <BaseButton size="sm" variant="danger" @click="$emit('delete', stop.id)">
              Del
            </BaseButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Stop } from '~/types';
import BaseButton from '~/components/UI/BaseButton.vue';

defineProps<{ stops: Stop[] | null }>();
defineEmits(['toggle', 'edit', 'delete']);

function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return '-';
  try { return new Date(dateTimeString).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' }); }
  catch (e) { return 'Ongeldige datum'; }
}
</script>
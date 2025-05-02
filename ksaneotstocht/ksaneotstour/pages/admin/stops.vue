<template>
  <div> <h2 class="text-2xl md:text-3xl font-semibold mb-6 text-brand-yellow">Stop Beheer</h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ editMode ? 'Stop Bewerken' : 'Nieuwe Stop Toevoegen' }}</h3>
        <AdminStopForm :stop-to-edit="stopBeingEdited" @saved="handleFormSaved" @cancelled="cancelEdit" />
      </div>

      <div class="lg:col-span-2">
        <h3 class="text-xl font-semibold mb-4 text-gray-300">Bestaande Stops</h3>
         <div v-if="pending" class="text-center py-10 text-gray-400">Laden...</div>
         <div v-else-if="error" class="p-4 bg-red-900 border border-red-700 rounded text-red-200">
           Kon stops niet laden: {{ error.data?.message || error.message }} </div>
         <AdminStopList v-else :stops="allStops" @toggle="handleToggle" @edit="handleEdit" @delete="handleDelete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// --- CORRIGEER IMPORT PADEN ---
import AdminStopList from '~/components/admin/StopList.vue'; // Hoofdletter A
import AdminStopForm from '~/components/admin/StopForm.vue'; // Hoofdletter A
// ---
import type { Stop } from '~/types';

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

useHead({ title: 'Admin - Stop Beheer' })

const editMode = ref(false);
const stopBeingEdited = ref<Stop | null>(null);

// Fetch all stops
const { data: allStops, pending, error, refresh } = await useFetch<Stop[]>('/api/admin/stops', {
  default: () => [],
  lazy: false
});

// --- Event Handlers (geen wijzigingen nodig hier) ---
function handleEdit(stop: Stop) { stopBeingEdited.value = { ...stop }; editMode.value = true; if (process.client && window.innerWidth < 1024) { window.scrollTo({ top: 0, behavior: 'smooth' }); } }
function cancelEdit() { stopBeingEdited.value = null; editMode.value = false; }
async function handleFormSaved() { console.log('Stop opgeslagen/toegevoegd'); cancelEdit(); await refresh(); }
async function handleToggle(stop: Stop) { const newState = !stop.is_manually_disabled; console.log(`Toggling stop ${stop.id} to ${newState ? 'DISABLED' : 'ENABLED'}`); try { await $fetch(`/api/admin/stops/${stop.id}`, { method: 'PATCH', body: { is_manually_disabled: newState } }); await refresh(); } catch (err) { console.error("Toggle failed:", err); alert('Kon stop status niet wijzigen.'); } }
async function handleDelete(stopId: number) { if (!confirm(`Weet je zeker dat je stop #${stopId} wilt verwijderen?`)) return; console.log('Deleting stop:', stopId); try { await $fetch(`/api/admin/stops/${stopId}`, { method: 'DELETE' }); await refresh(); } catch (err) { console.error("Delete failed:", err); alert('Kon stop niet verwijderen.'); } }
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
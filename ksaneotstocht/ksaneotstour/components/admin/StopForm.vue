label<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-400 mb-1">Naam</label>
      <input type="text" id="name" v-model="formData.name" required class="mt-1 block w-95% px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm" />
    </div>

    <div>
       <label class="block text-sm font-medium text-gray-400 mb-1">Locatie (Klik/Sleep op kaart)</label>
       <div ref="locationMapContainer" class="w-95% h-64 rounded bg-gray-600 border border-gray-500 mb-2 z-0">
          <p v-if="!locationMapReady" class="text-center text-gray-400 pt-4">Locatie kaart laden...</p>
       </div>
       <div class="grid grid-cols-2 gap-2 text-xs">
           <div>
               <label for="latitude" class="block text-gray-500">Latitude</label>
               <input type="number" step="any" id="latitude" v-model.number="formData.latitude" readonly required class="mt-1 block w-95% px-2 py-1 bg-gray-600 border border-gray-500 rounded-md text-gray-300 sm:text-xs cursor-not-allowed" />
           </div>
           <div>
               <label for="longitude" class="block text-gray-500">Longitude</label>
               <input type="number" step="any" id="longitude" v-model.number="formData.longitude" readonly required class="mt-1 block w-95% px-2 py-1 bg-gray-600 border border-gray-500 rounded-md text-gray-300 sm:text-xs cursor-not-allowed" />
           </div>
       </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div>
         <label for="start_time" class="block text-sm font-medium text-gray-400 mb-1">Start Tijd</label>
         <input type="datetime-local" id="start_time" v-model="formData.start_time" required :class="inputClasses" />
       </div>
       <div>
         <label for="end_time" class="block text-sm font-medium text-gray-400 mb-1">Eind Tijd</label>
         <input type="datetime-local" id="end_time" v-model="formData.end_time" required :class="inputClasses" />
       </div>
    </div>

    <div>
      <label for="color" class="block text-sm font-medium text-gray-400 mb-1">Kleur</label>
      <input type="color" id="color" v-model="formData.color" required class="mt-1 block w-95% h-10 px-1 py-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow" />
       <span class="text-xs text-gray-400">Huidige kleur: {{ formData.color }}</span>
    </div>


    <div v-if="formError" class="text-red-400 text-sm bg-red-900 border border-red-700 p-2 rounded">
        {{ formError }}
    </div>

    <div class="flex justify-end space-x-3 pt-4">
        <BaseButton type="button" variant="secondary" @click="handleCancel">
            Annuleren
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="loading || !isFormValid">
             {{ loading ? 'Opslaan...' : (isEditMode ? 'Wijzigingen Opslaan' : 'Stop Toevoegen') }}
        </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import type { Stop, StopFormData } from '~/types';
import BaseButton from '~/components/UI/BaseButton.vue';

// --- Props & Emits ---
const props = defineProps<{ stopToEdit: Stop | null }>();
const emit = defineEmits(['saved', 'cancelled']);

// --- State ---
const isEditMode = computed(() => !!props.stopToEdit);
const loading = ref(false);
const formError = ref<string | null>(null);
const initialFormData: StopFormData = { /* ... (zoals voorheen) ... */ name: '', latitude: null, longitude: null, start_time: '', end_time: '', color: '#fad30f' };
const formData = ref<StopFormData>({ ...initialFormData });

// --- Location Picker Map State ---
const locationMapContainer = ref<HTMLElement | null>(null);
const locationMapReady = ref(false);
let locationMapInstance: any = null;
let locationMarker: any = null;
let L: any = null;
const WACHTEBEKE_COORDS: [number, number] = [51.18, 3.85]; // Hergebruik coördinaten

// --- Input Styling ---
const inputClasses = "mt-1 block w-95% px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm";

// --- Form Validation ---
const isFormValid = computed(() => {
    return formData.value.name &&
           formData.value.latitude !== null &&
           formData.value.longitude !== null &&
           formData.value.start_time &&
           formData.value.end_time &&
           formData.value.color;
           // Add more specific validation if needed
});

// --- Watchers ---
watch(() => props.stopToEdit, (newStop) => {
  formError.value = null; // Reset error on change
  if (newStop) {
    formData.value = {
      name: newStop.name ?? '', latitude: newStop.latitude, longitude: newStop.longitude,
      start_time: formatDateTimeForInput(newStop.start_time),
      end_time: formatDateTimeForInput(newStop.end_time),
      color: newStop.color ?? '#fad30f',
    };
    // Update location picker map if ready
    if (locationMapReady.value && newStop.latitude && newStop.longitude) {
       updateLocationMarker(newStop.latitude, newStop.longitude, true); // Center map too
    }
  } else {
    formData.value = { ...initialFormData };
     // Reset location picker map
     if (locationMapReady.value) {
        resetLocationPicker();
     }
  }
}, { immediate: true });

// --- Methods ---
function formatDateTimeForInput(isoString: string | null | undefined): string { /* ... (zoals voorheen) ... */ if (!isoString) return ''; try { const date = new Date(isoString); const offset = date.getTimezoneOffset() * 60000; const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16); return localISOTime; } catch (e) { return ''; } }

async function handleSubmit() {
  loading.value = true;
  formError.value = null;

  // Basis validatie (frontend)
  if (!isFormValid.value) {
      formError.value = 'Vul alstublieft alle vereiste velden correct in.';
      loading.value = false;
      return;
  }
  if (formData.value.end_time <= formData.value.start_time) {
    formError.value = 'Eindtijd moet na starttijd liggen.';
    loading.value = false;
    return;
  }

  try {
    // --- Maak een payload object voor verzending ---
    const payload: any = {
       name: formData.value.name,
       latitude: formData.value.latitude,
       longitude: formData.value.longitude,
       color: formData.value.color,
       start_time: '', // Initialiseer
       end_time: '',   // Initialiseer
    };

    // --- CONVERTEER DATUM/TIJD NAAR ISO STRING (UTC) ---
    if (formData.value.start_time) {
       try {
           // new Date() met datetime-local string interpreteert het als LOKALE tijd
           // .toISOString() converteert het naar UTC ISO 8601 string
           payload.start_time = new Date(formData.value.start_time).toISOString();
           console.log(`Converted start_time: ${formData.value.start_time} -> ${payload.start_time}`);
       } catch (e) {
           console.error("Invalid start_time format from input:", formData.value.start_time);
           formError.value = 'Ongeldig starttijd formaat ingevoerd.';
           loading.value = false;
           return; // Stop executie
       }
    } else {
         formError.value = 'Starttijd is vereist.'; // Zou al door 'required' afgevangen moeten zijn
         loading.value = false;
         return;
    }

    if (formData.value.end_time) {
        try {
            payload.end_time = new Date(formData.value.end_time).toISOString();
            console.log(`Converted end_time: ${formData.value.end_time} -> ${payload.end_time}`);
        } catch (e) {
           console.error("Invalid end_time format from input:", formData.value.end_time);
           formError.value = 'Ongeldig eindtijd formaat ingevoerd.';
           loading.value = false;
           return; // Stop executie
       }
    } else {
        formError.value = 'Eindtijd is vereist.';
        loading.value = false;
        return;
    }
    // --- EINDE CONVERSIE ---


    // Verstuur de payload met geconverteerde datums
    if (isEditMode.value && props.stopToEdit?.id) {
      console.log("Submitting UPDATE with payload:", payload);
      await $fetch(`/api/admin/stops/${props.stopToEdit.id}`, {
        method: 'PATCH', // Of PUT, check je API endpoint
        body: payload,
      });
    } else {
      console.log("Submitting CREATE with payload:", payload);
      await $fetch('/api/admin/stops', {
        method: 'POST',
        body: payload,
      });
    }
    emit('saved'); // Signaal naar parent dat opslaan gelukt is

  } catch (error: any) {
    console.error('Form submission error:', error);
    // Geef specifiekere feedback
    if (error.statusCode === 403) {
         formError.value = 'Fout: Geen toestemming om op te slaan (403). Sessie probleem?';
    } else if (error.statusCode === 400) {
         formError.value = `Validatiefout van server: ${error.data?.message || 'Onbekende validatiefout.'}`;
    } else {
         formError.value = error.data?.message || 'Kon de stop niet opslaan door een serverfout.';
    }
  } finally {
    loading.value = false;
  }
}
function handleCancel() { emit('cancelled'); }

// --- Location Picker Map Logic ---
async function initializeLocationMap() {
  if (!process.client || !locationMapContainer.value || locationMapInstance) return;

  try {
    L = await import('leaflet');
    // CSS wordt al globaal geïmporteerd

    locationMapInstance = L.map(locationMapContainer.value).setView(WACHTEBEKE_COORDS, 13); // Start in Wachtebeke

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
      maxZoom: 18, // Beperk zoom eventueel
    }).addTo(locationMapInstance);

    // Event listener voor klikken op de kaart
    locationMapInstance.on('click', (e: any) => {
        updateLocationMarker(e.latlng.lat, e.latlng.lng);
    });

    locationMapReady.value = true;

    // Als we in edit mode zijn en coördinaten hebben, plaats de marker direct
    if (props.stopToEdit?.latitude && props.stopToEdit?.longitude) {
        updateLocationMarker(props.stopToEdit.latitude, props.stopToEdit.longitude, true);
    } else {
        // Optioneel: plaats een default marker of geef instructie
         updateLocationMarker(WACHTEBEKE_COORDS[0], WACHTEBEKE_COORDS[1]); // Start marker in Wachtebeke
         // Of geen marker initieel:
         // if (locationMarker) { locationMapInstance.removeLayer(locationMarker); locationMarker = null; }
         // formData.value.latitude = null; formData.value.longitude = null;
    }

  } catch (error) {
    console.error('Error initializing location picker map:', error);
  }
}

function updateLocationMarker(lat: number, lng: number, centerMap = false) {
  if (!locationMapInstance || !L) return;

  // Update form data
  formData.value.latitude = parseFloat(lat.toFixed(6)); // Rond af voor netheid
  formData.value.longitude = parseFloat(lng.toFixed(6));

  if (!locationMarker) {
    // Maak marker aan als hij nog niet bestaat
    locationMarker = L.marker([lat, lng], {
      draggable: true // Maak marker versleepbaar
    }).addTo(locationMapInstance);

    // Event listener voor slepen van de marker
    locationMarker.on('dragend', (event: any) => {
      const marker = event.target;
      const position = marker.getLatLng();
      updateLocationMarker(position.lat, position.lng); // Update form na slepen
    });
  } else {
    // Verplaats bestaande marker
    locationMarker.setLatLng([lat, lng]);
  }

  // Centreer kaart op marker indien nodig
  if (centerMap) {
      locationMapInstance.setView([lat, lng], locationMapInstance.getZoom() || 15); // Zoom 15 bij centreren?
  }
}

function resetLocationPicker() {
   if (!locationMapInstance) return;
   // Verwijder marker, reset view
   if (locationMarker) {
       locationMapInstance.removeLayer(locationMarker);
       locationMarker = null;
   }
   formData.value.latitude = null;
   formData.value.longitude = null;
   locationMapInstance.setView(WACHTEBEKE_COORDS, 13);
}


// Initialiseer kaart als component mount
onMounted(() => {
    initializeLocationMap();
});

// Ruim kaart op
onUnmounted(() => {
  if (locationMapInstance) {
    locationMapInstance.remove();
    locationMapInstance = null;
    locationMarker = null; // Zorg dat marker referentie ook weg is
    locationMapReady.value = false;
  }
});

</script>

<style scoped>
/* Zorg dat map container een expliciete hoogte heeft */
.h-64 { height: 16rem; /* 256px */ }

/* Leaflet container styling override indien nodig */
:deep(.leaflet-container) {
   background: #4a5568; /* gray-700 */
   border-radius: 0.375rem; /* rounded */
   border: 1px solid #718096; /* gray-500 */
}

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
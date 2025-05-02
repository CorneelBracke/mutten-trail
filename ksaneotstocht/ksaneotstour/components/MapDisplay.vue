<!-- Option 2: Using viewport height -->
<template>
  <div
    ref="mapContainer"
    class="h-[70vh] overflow-hidden rounded shadow bg-gray-700 z-0"
  >
    <p v-if="!leafletReady" class="text-white p-4">Kaart laden...</p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { Stop } from '~/types'; // Zorg dat dit type bestaat in ~/types

// Props om stops te ontvangen
const props = defineProps<{
  stops: Stop[] | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const leafletReady = ref(false);
let mapInstance: any = null;
let L: any = null;
let markersLayer: any = null;

// --- Adjusted Coordinaten Wachtebeke ---
// Original coordinates: [51.18, 3.85]
// Moving 200m east: Δlong ≈ 200m/70100 ≈ 0.00285 degree increase
// Moving 500m south: Δlat ≈ 500m/111320 ≈ 0.00449 degree decrease
const WACHTEBEKE_COORDS: [number, number] = [51.18 - 0.00999, 3.85 + 0.00650];
const INITIAL_ZOOM = 15; // Zoom niveau
// ---

async function initializeMap() {
  if (!process.client || !mapContainer.value) return;

  try {
    L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    if (mapInstance) return; // Voorkom herinitialisatie

    mapInstance = L.map(mapContainer.value).setView(WACHTEBEKE_COORDS, INITIAL_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);
    leafletReady.value = true;
    updateMarkers();

  } catch (error) {
    console.error('Error loading or initializing Leaflet:', error);
  }
}

function updateMarkers() {
  if (!mapInstance || !L || !markersLayer) return;
  markersLayer.clearLayers();

  if (!props.stops) return;

  props.stops.forEach((stop: Stop) => {
    if (stop.latitude != null && stop.longitude != null) {
      const icon = L.divIcon({
          html: `<span style="background-color: ${stop.color || '#FFFFFF'}; width: 1rem; height: 1rem; border-radius: 50%; display: inline-block; border: 1px solid black;"></span>`,
          className: '', 
          iconSize: [16, 16],
          iconAnchor: [8, 8]
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: icon })
         .bindPopup(`<b>${stop.name || 'Stop'}</b>`);
      markersLayer.addLayer(marker);
    }
  });
}

onMounted(() => { initializeMap(); });
watch(() => props.stops, () => { if (leafletReady.value) updateMarkers(); }, { deep: true });
onUnmounted(() => { if (mapInstance) { mapInstance.remove(); mapInstance = null; leafletReady.value = false; } });
</script>

<style>
/* Zorg dat Leaflet CSS correct geladen wordt */
@import 'leaflet/dist/leaflet.css';

.h-\[500px\] { height: 50M; }
@media (min-width: 768px) { /* md: */
  .md\:h-\[600px\] { height: 600px; }
}

/* Optionele styling voor de custom marker */
.leaflet-div-icon span {
  box-shadow: 0 0 3px rgba(0,0,0,0.5);
}
</style>
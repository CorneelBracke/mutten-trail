// store/stops.ts
import { defineStore } from 'pinia';
import type { Stop } from '~/types/'; // Definieer types!

export const useStopsStore = defineStore('stops', {
  state: () => ({
    activeStops: [] as Stop[],
    allStops: [] as Stop[],
    isLoadingActive: false,
    isLoadingAll: false,
    errorActive: null as string | null,
    errorAll: null as string | null,
  }),
  actions: {
    async fetchActiveStops() {
      this.isLoadingActive = true;
      this.errorActive = null;
      try {
        // Gebruik de composable of $fetch direct
        const data = await $fetch<Stop[]>('/api/stops/active');
        this.activeStops = data ?? [];
      } catch (error: any) {
        console.error("Error fetching active stops:", error);
        this.errorActive = error.data?.message || 'Kon actieve stops niet laden.';
        this.activeStops = []; // Reset op fout
      } finally {
        this.isLoadingActive = false;
      }
    },
    async fetchAllStops() {
      this.isLoadingAll = true;
      this.errorAll = null;
      try {
         // Gebruik de composable of $fetch direct
        const data = await $fetch<Stop[]>('/api/admin/stops');
        this.allStops = data ?? [];
      } catch (error: any) {
        console.error("Error fetching all stops:", error);
        this.errorAll = error.data?.message || 'Kon admin stops niet laden.';
        this.allStops = []; // Reset op fout
      } finally {
        this.isLoadingAll = false;
      }
    },
    // Voeg hier acties toe voor add, update, delete, toggle
    // Deze acties roepen de API aan en refreshen dan this.fetchAllStops()
  },
});
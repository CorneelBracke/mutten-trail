// store/auth.ts
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Use null initially to indicate "unknown" state until checked
    _isAdmin: null as boolean | null,
  }),
  getters: {
    isAdmin: (state): boolean => state._isAdmin === true,
  },
  actions: {
    async login(password: string) {
      try {
        // Clear previous state
        this._isAdmin = false;
        await $fetch('/api/admin/auth', {
          method: 'POST',
          body: { password },
        });
        // Assume login successful if no error is thrown
        this._isAdmin = true;
        console.log("Pinia store: Login successful");
      } catch (error) {
        console.error("Pinia store: Login action failed:", error);
        this._isAdmin = false;
        throw error; // Re-throw for component to handle UI
      }
    },
    async logout() {
      try {
        await $fetch('/api/admin/auth', { method: 'DELETE' });
        console.log("Pinia store: Logout successful");
      } catch (error) {
        console.error("Pinia store: Logout action failed:", error);
        // Still set isAdmin to false even if API call fails? Decide strategy.
      } finally {
         // Always set to false on logout attempt
         this._isAdmin = false;
      }
    },
    async checkAuth() {
       // Avoid multiple checks if already known
       if (this._isAdmin !== null) return;

       console.log("Pinia store: Checking auth status...");
      try {
        const data = await $fetch<{ isAdmin: boolean }>('/api/admin/auth', { method: 'GET' });
        this._isAdmin = data.isAdmin === true;
        console.log("Pinia store: Auth check result:", this._isAdmin);
      } catch (error) {
        console.error("Pinia store: Auth check failed:", error);
        this._isAdmin = false; // Assume not admin if check fails
      }
    },
     // Action to directly set state (e.g., after SSR check if implemented)
     setAdminStatus(isAdmin: boolean) {
       this._isAdmin = isAdmin;
     }
  },
});
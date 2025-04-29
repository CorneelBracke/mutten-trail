// middleware/auth.ts
import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server side for initial load if not needed,
  // or handle server-side session check differently if required.
  // This example assumes client-side check after potential server check.
  if (process.server) return; // Or implement server-side check

  const authStore = useAuthStore();

  // If auth state is unknown, try to check it via API
  if (authStore.isAdmin === null) {
    console.log("Auth middleware: checking auth state...");
    await authStore.checkAuth();
  }

  console.log(`Auth middleware: isAdmin = ${authStore.isAdmin}`);

  // If still not admin after check, and trying to access a protected route
  if (!authStore.isAdmin && to.path.startsWith('/admin') && to.path !== '/admin') {
    console.log("Auth middleware: Not authenticated, redirecting to /admin");
    return navigateTo('/admin'); // Redirect to login page
  }

  // Allow navigation if authenticated or accessing the login page itself
  console.log("Auth middleware: Allowed navigation to", to.path);
});
// composables/useAuth.ts
import { useAuthStore } from '~/store/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();

  const login = async (password: string) => {
    await authStore.login(password); // Delegate to store
     if (authStore.isAdmin) {
       await router.push('/admin/stops');
     }
  };

  const logout = async () => {
    await authStore.logout(); // Delegate to store
    await router.push('/admin');
  };

  const checkAuthState = async () => {
    await authStore.checkAuth(); // Delegate to store
  };

  // Return reactive state and methods
  return {
    isAdmin: computed(() => authStore.isAdmin), // Readonly computed ref
    login,
    logout,
    checkAuthState,
  };
};
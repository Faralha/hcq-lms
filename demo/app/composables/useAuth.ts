import type { AuthUser } from "~/types/auth";

/**
 * Auth composable - wrapper around Pinia auth store
 * Provides authentication state and methods
 */
export const useAuth = () => {
  // Casting to any to avoid circular dependency type inference issues
  const authStore = useAuthStore() as any;

  return {
    // State
    user: computed(() => authStore.user),
    isLoading: computed(() => authStore.isLoading),

    // Getters
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userRole: computed(() => authStore.userRole),
    isAdmin: computed(() => authStore.isAdmin),
    isPengajar: computed(() => authStore.isPengajar),
    isPelajar: computed(() => authStore.isPelajar),

    // Actions
    setUser: (userData: AuthUser | null, accessToken?: string) => {
      authStore.setUser(userData, accessToken);
    },
    fetchUser: () => authStore.fetchUser(),
    logout: () => authStore.logout(),
  };
};

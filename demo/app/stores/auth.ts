import { defineStore } from "pinia";
import type { AuthUser } from "~/types/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && !!state.accessToken,
    userRole: (state) => state.user?.role?.toUpperCase() || null,
    isAdmin: (state) => state.user?.role?.toUpperCase() === "ADMIN",
    isPengajar: (state) => state.user?.role?.toUpperCase() === "PENGAJAR",
    isPelajar: (state) => state.user?.role?.toUpperCase() === "PELAJAR",
  },

  actions: {
    setUser(userData: AuthUser | null, accessToken?: string) {
      this.user = userData;
      if (accessToken) {
        this.accessToken = accessToken;
      }
      console.log("[authStore] User set:", this.user);
      console.log(
        "[authStore] Access token:",
        this.accessToken?.substring(0, 20) + "..."
      );
    },

    setAccessToken(token: string) {
      this.accessToken = token;
      console.log("[authStore] Access token updated");
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      console.log("[authStore] Auth cleared");
    },

    async fetchUser() {
      if (this.isLoading) return;

      // Don't fetch if no access token exists
      const { getAccessToken } = useTokens();
      if (!getAccessToken()) {
        console.log("[authStore] No access token, skipping fetchUser");
        return;
      }

      this.isLoading = true;
      try {
        const authApi = useAuthApi();
        const response = await authApi.getCurrentUser();

        console.log(
          "[authStore] fetchUser response:",
          JSON.stringify(response, null, 2)
        );

        // Handle different response structures
        let userData: AuthUser | null = null;
        const res = response as any;

        if (res?.status && res?.data) {
          userData = res.data;
        } else if (res?.id && res?.email) {
          userData = res;
        } else if (res?.data?.id && res?.data?.email) {
          userData = res.data;
        } else if (res?.data?.data?.id && res?.data?.data?.email) {
          userData = res.data.data;
        }

        if (userData && userData.id) {
          this.user = userData;
        } else {
          console.warn("[authStore] No valid user data found in response");
          this.user = null;
        }
      } catch (error: any) {
        console.error("[authStore] Failed to fetch user:", error);

        if (error?.statusCode !== 401) {
          this.clearAuth();
        }
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        const authApi = useAuthApi();
        await authApi.logout();
      } catch (error) {
        console.error("[authStore] Logout error:", error);
      } finally {
        this.clearAuth();
        navigateTo("/auth/login");
      }
    },
  },

  persist: {
    storage: localStorage,
    paths: ["user", "accessToken"],
  },
});

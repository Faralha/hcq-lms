/**
 * Token Management Composable
 * Handles Access Token via Pinia store (persisted in localStorage)
 * Refresh Token handled by backend (httpOnly cookie)
 */
export const useTokens = () => {
  /**
   * Get access token from Pinia store
   */
  const getAccessToken = (): string | null => {
    const authStore = useAuthStore()
    return authStore.accessToken
  }

  /**
   * Set access token to Pinia store
   */
  const setAccessToken = (token: string): void => {
    const authStore = useAuthStore()
    authStore.setAccessToken(token)
  }

  /**
   * Check if access token exists
   */
  const hasAccessToken = (): boolean => {
    return !!getAccessToken()
  }

  /**
   * Clear all tokens (logout)
   */
  const clearTokens = (): void => {
    const authStore = useAuthStore()
    authStore.clearAuth()
    // Refresh token will be cleared by backend when calling logout endpoint
  }

  return {
    getAccessToken,
    setAccessToken,
    hasAccessToken,
    clearTokens,
  }
}

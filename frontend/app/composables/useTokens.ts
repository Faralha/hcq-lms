/**
 * Token Management Composable
 * Handles Access Token (sessionStorage) and Refresh Token (httpOnly cookie)
 * 
 * Flow:
 * - Access Token: Stored in sessionStorage, sent via Authorization header
 * - Refresh Token: Stored in httpOnly cookie by backend, automatically sent
 */
export const useTokens = () => {
  const ACCESS_TOKEN_KEY = 'access_token'

  /**
   * Get access token from sessionStorage
   */
  const getAccessToken = (): string | null => {
    if (import.meta.client) {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY)
    }
    return null
  }

  /**
   * Set access token to sessionStorage
   */
  const setAccessToken = (token: string): void => {
    if (import.meta.client) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    }
  }

  /**
   * Remove access token from sessionStorage
   */
  const removeAccessToken = (): void => {
    if (import.meta.client) {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    }
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
    removeAccessToken()
    // Refresh token will be cleared by backend when calling logout endpoint
  }

  return {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    hasAccessToken,
    clearTokens,
  }
}

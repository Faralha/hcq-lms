import type { AuthUser } from '~/types/auth'

/**
 * Auth state management composable
 * Manages user authentication state across the app
 * Uses Access Token (sessionStorage) + Refresh Token (httpOnly cookie)
 */
export const useAuth = () => {
  const { setAccessToken, clearTokens } = useTokens()
  
  // User state (shared across app)
  const user = useState<AuthUser | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Get user role
   */
  const userRole = computed(() => user.value?.role?.toUpperCase() || null)

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => userRole.value === 'ADMIN')

  /**
   * Check if user is pengajar
   */
  const isPengajar = computed(() => userRole.value === 'PENGAJAR')

  /**
   * Check if user is pelajar
   */
  const isPelajar = computed(() => userRole.value === 'PELAJAR')

  /**
   * Fetch current user from API
   */
  const fetchUser = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
      const authApi = useAuthApi()
      const response = await authApi.getCurrentUser()

      console.log('[useAuth] fetchUser response:', JSON.stringify(response, null, 2))
      console.log('[useAuth] Response keys:', Object.keys(response || {}))

      // Handle different response structures from backend
      let userData: AuthUser | null = null

      // Cast to any for flexible structure handling
      const res = response as any

      // Try to extract user data from different structures
      if (res?.id && res?.email) {
        // Direct structure: { id, email, role, ... }
        userData = res
        console.log('[useAuth] Using direct response structure')
      } else if (res?.data?.id && res?.data?.email) {
        // Nested structure: { data: { id, email, role, ... } }
        userData = res.data
        console.log('[useAuth] Using nested data structure')
      } else if (res?.data?.data?.id && res?.data?.data?.email) {
        // Double nested: { data: { data: { id, ... } } }
        userData = res.data.data
        console.log('[useAuth] Using double nested structure')
      }

      console.log('[useAuth] Extracted user data:', userData)

      if (userData && userData.id) {
        user.value = userData
      } else {
        console.warn('[useAuth] No valid user data found in response')
        user.value = null
      }
    } catch (error: any) {
      console.error('[useAuth] Failed to fetch user:', error)
      
      // If 401, token might be expired - useApi will auto-refresh
      // Don't clear tokens here, let useApi handle it
      if (error?.statusCode === 401) {
        console.log('[useAuth] 401 error - token refresh should be attempted by useApi')
        // User will be set to null, but tokens won't be cleared
        // This allows auto-refresh to work
        user.value = null
      } else {
        // For other errors, clear everything
        user.value = null
        clearTokens()
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Set user data and access token
   */
  const setUser = (userData: AuthUser | null, accessToken?: string) => {
    user.value = userData
    
    // Save access token to sessionStorage if provided
    if (accessToken) {
      setAccessToken(accessToken)
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      const authApi = useAuthApi()
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user state and tokens
      user.value = null
      clearTokens()
      
      // Redirect to login
      navigateTo('/auth/login')
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    userRole,
    isAdmin,
    isPengajar,
    isPelajar,
    fetchUser,
    setUser,
    logout,
  }
}

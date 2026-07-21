/**
 * Auth Middleware
 * Ensures user is authenticated before accessing protected routes
 * 
 * IMPORTANT: This middleware only runs on CLIENT-SIDE
 * because protected pages have ssr: false
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client-side (cookies & sessionStorage only in browser)
  if (!import.meta.client) {
    return
  }

  const { isAuthenticated, fetchUser, isLoading, user } = useAuth()
  const { getAccessToken } = useTokens()

  console.log('[auth middleware] Checking auth for:', to.path)
  console.log('[auth middleware] Current user:', user.value)
  console.log('[auth middleware] Has access token:', !!getAccessToken())

  // Skip auth check for auth pages
  if (to.path.startsWith('/auth/')) {
    // If already authenticated, redirect to home
    if (isAuthenticated.value) {
      console.log('[auth middleware] Already authenticated, redirecting to home')
      return navigateTo('/')
    }
    return
  }

  // Check if we have an access token
  const hasToken = !!getAccessToken()
  
  // Fetch user if not loaded yet AND we have a token
  if (!user.value && !isLoading.value && hasToken) {
    console.log('[auth middleware] User not loaded, fetching...')
    await fetchUser()
    console.log('[auth middleware] After fetch - user:', user.value)
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    console.log('[auth middleware] Not authenticated, redirecting to login')
    return navigateTo('/auth/login')
  }

  console.log('[auth middleware] Authenticated, allowing access')
})

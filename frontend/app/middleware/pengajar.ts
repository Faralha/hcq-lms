/**
 * Pengajar Middleware
 * Restricts access to pengajar-only routes (/pengajar/*)
 * 
 * IMPORTANT: Only runs on client-side (ssr: false on protected pages)
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client-side
  if (!import.meta.client) {
    return
  }

  const { isPengajar, isAdmin, fetchUser, isLoading, user, userRole } = useAuth()

  console.log('[pengajar middleware] Checking access for:', to.path)
  console.log('[pengajar middleware] Current user:', user.value)
  console.log('[pengajar middleware] User role:', userRole.value)
  console.log('[pengajar middleware] isPengajar:', isPengajar.value)
  console.log('[pengajar middleware] isAdmin:', isAdmin.value)

  // Fetch user if not loaded
  if (!user.value && !isLoading.value) {
    console.log('[pengajar middleware] User not loaded, fetching...')
    await fetchUser()
    console.log('[pengajar middleware] After fetch - user:', user.value)
    console.log('[pengajar middleware] After fetch - role:', userRole.value)
    console.log('[pengajar middleware] After fetch - isPengajar:', isPengajar.value)
  }

  // Allow admin to access pengajar routes
  if (isAdmin.value) {
    console.log('[pengajar middleware] User is admin, allowing access')
    return
  }

  // Check if user is pengajar
  if (!isPengajar.value) {
    console.log('[pengajar middleware] Access denied - not pengajar')
    const toast = useToast()
    toast.add({
      title: 'Akses Ditolak',
      description: 'Halaman ini hanya untuk Pengajar',
      color: 'error',
      icon: 'i-lucide-shield-alert',
    })
    return navigateTo('/')
  }

  console.log('[pengajar middleware] Access granted')
})

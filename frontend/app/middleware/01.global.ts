/**
 * Global Route Middleware
 * Automatically applies role-based middleware based on route path
 * This runs for ALL routes
 */
export default defineNuxtRouteMiddleware((to) => {
  // Only run on client-side
  if (!import.meta.client) {
    return
  }

  console.log('[global] Route:', to.path)

  // Define route-based middleware mapping
  const routeMiddleware: Record<string, string[]> = {
    '/admin': ['admin'],
    '/pengajar': ['pengajar'],
    '/pelajar': ['pelajar'],
    '/profile': ['auth'],
  }

  // Check if route matches any protected path
  for (const [path, middlewares] of Object.entries(routeMiddleware)) {
    if (to.path.startsWith(path)) {
      console.log(`[global] Route ${to.path} requires middleware:`, middlewares)
      
      // Run authentication check
      if (middlewares.includes('auth')) {
        const { user } = useAuth()
        if (!user.value) {
          const toast = useToast()
          toast.add({
            title: 'Akses Ditolak',
            description: 'Silakan login terlebih dahulu',
            color: 'error',
            icon: 'i-lucide-lock',
          })
          return navigateTo('/auth/login')
        }
      }
      
      // Run role-based middleware
      if (middlewares.includes('admin')) {
        const { isAdmin, user } = useAuth()
        if (!isAdmin.value) {
          const toast = useToast()
          toast.add({
            title: 'Akses Ditolak',
            description: 'Halaman ini hanya untuk Admin',
            color: 'error',
            icon: 'i-lucide-shield-alert',
          })
          return navigateTo('/')
        }
      }
      
      if (middlewares.includes('pengajar')) {
        const { isPengajar, isAdmin, user } = useAuth()
        // Admin can access pengajar routes
        if (!isPengajar.value && !isAdmin.value) {
          const toast = useToast()
          toast.add({
            title: 'Akses Ditolak',
            description: 'Halaman ini hanya untuk Pengajar',
            color: 'error',
            icon: 'i-lucide-shield-alert',
          })
          return navigateTo('/')
        }
      }
      
      if (middlewares.includes('pelajar')) {
        const { isPelajar, isAdmin, user } = useAuth()
        // Admin can access pelajar routes
        if (!isPelajar.value && !isAdmin.value) {
          const toast = useToast()
          toast.add({
            title: 'Akses Ditolak',
            description: 'Halaman ini hanya untuk Pelajar',
            color: 'error',
            icon: 'i-lucide-shield-alert',
          })
          return navigateTo('/')
        }
      }
    }
  }
})

/**
 * Pelajar Middleware
 * Restricts access to pelajar-only routes (/pelajar/*)
 * 
 * IMPORTANT: Only runs on client-side (ssr: false on protected pages)
 */
export default defineNuxtRouteMiddleware(async () => {
  // Only run on client-side
  if (!import.meta.client) {
    return
  }

  const { isPelajar, isAdmin, fetchUser, isLoading, user } = useAuth()

  // Fetch user if not loaded
  if (!user.value && !isLoading.value) {
    await fetchUser()
  }

  // Allow admin to access pelajar routes
  if (isAdmin.value) {
    return
  }

  // Check if user is pelajar
  if (!isPelajar.value) {
    const toast = useToast()
    toast.add({
      title: 'Akses Ditolak',
      description: 'Halaman ini hanya untuk Pelajar',
      color: 'error',
      icon: 'i-lucide-shield-alert',
    })
    return navigateTo('/')
  }
})

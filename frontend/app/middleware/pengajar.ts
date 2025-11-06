/**
 * Pengajar Middleware
 * Restricts access to pengajar-only routes (/pengajar/*)
 * 
 * IMPORTANT: Only runs on client-side (ssr: false on protected pages)
 */
export default defineNuxtRouteMiddleware(async () => {
  // Only run on client-side
  if (!import.meta.client) {
    return
  }

  const { isPengajar, isAdmin, fetchUser, isLoading, user } = useAuth()

  // Fetch user if not loaded
  if (!user.value && !isLoading.value) {
    await fetchUser()
  }

  // Allow admin to access pengajar routes
  if (isAdmin.value) {
    return
  }

  // Check if user is pengajar
  if (!isPengajar.value) {
    const toast = useToast()
    toast.add({
      title: 'Akses Ditolak',
      description: 'Halaman ini hanya untuk Pengajar',
      color: 'error',
      icon: 'i-lucide-shield-alert',
    })
    return navigateTo('/')
  }
})

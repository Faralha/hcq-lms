/**
 * Admin Middleware
 * Restricts access to admin-only routes
 * Admin can access all directories
 * 
 * IMPORTANT: Only runs on client-side (ssr: false on protected pages)
 */
export default defineNuxtRouteMiddleware(async () => {
  // Only run on client-side
  if (!import.meta.client) {
    return
  }

  const { isAdmin, fetchUser, isLoading, user } = useAuth()

  // Fetch user if not loaded
  if (!user.value && !isLoading.value) {
    await fetchUser()
  }

  // Check if user is admin
  if (!isAdmin.value) {
    const toast = useToast()
    toast.add({
      title: 'Akses Ditolak',
      description: 'Anda tidak memiliki izin untuk mengakses halaman ini',
      color: 'error',
      icon: 'i-lucide-shield-alert',
    })
    return navigateTo('/')
  }
})

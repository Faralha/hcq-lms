<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <UPageCard class="text-center max-w-2xl">
      <div class="space-y-6">
        <div class="flex justify-center">
          <div class="p-4 bg-primary-100 rounded-full">
            <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary-600 animate-spin" />
          </div>
        </div>

        <div>
          <h1 class="text-3xl font-bold mb-2">HCQ Learning Management System</h1>
          <p class="text-gray-600">Redirecting you to the right dashboard...</p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { user, isAuthenticated, fetchUser } = useAuth()
const router = useRouter()

onMounted(async () => {
  // Fetch user if not loaded
  if (!user.value) {
    await fetchUser()
  }

  // Redirect based on role
  if (isAuthenticated.value && user.value?.role) {
    const role = user.value.role.toLowerCase()

    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'pengajar') {
      router.push('/pengajar')
    } else if (role === 'pelajar') {
      router.push('/pelajar')
    }
  } else {
    // If not authenticated, redirect to login
    router.push('/auth/login')
  }
})
</script>

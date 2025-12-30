<template>

  <!-- Hero -->
  <LandingHero />

  <!-- Statistics -->
  <LandingStatistics />

  <USeparator />
</template>

<script setup lang="ts">
const { user, isAuthenticated, fetchUser } = useAuth()
const router = useRouter()

definePageMeta({
  layout: 'landing',
  ssr: true,
})

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
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
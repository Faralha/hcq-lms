<template>

  <!-- Hero -->
  <LandingHero />

  <!-- Statistics -->
  <LandingStatistics2 />

  <USeparator />
</template>

<script setup lang="ts">
const { user, isAuthenticated, fetchUser } = useAuth()
const { getAccessToken } = useTokens()
const router = useRouter()

definePageMeta({
  layout: 'landing',
  ssr: false,
})

useSeoMeta({
  title: 'HCQ - Home',
  ogTitle: 'HCQ - Home',
  description: "Halaqoh Cinta Qur'an (HCQ) adalah lembaga pembelajaran Al-Qur'an terpecaya. Kami menawarkan program Tahsin dan Tahfidz berkualitas untuk membantu anda memperbaiki bacaan dan menghafal Al-Qur'an.",
  ogDescription: "Halaqoh Cinta Qur'an (HCQ) adalah lembaga pembelajaran Al-Qur'an terpecaya. Kami menawarkan program Tahsin dan Tahfidz berkualitas untuk membantu anda memperbaiki bacaan dan menghafal Al-Qur'an.",
})

onMounted(async () => {
  // Only fetch user if we have an access token and user is not loaded
  const hasToken = !!getAccessToken()

  if (!user.value && hasToken) {
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
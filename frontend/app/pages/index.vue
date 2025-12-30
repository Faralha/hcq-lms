<template>
  <div>
    <h1>HCQ Learning Management Systems.</h1>
  </div>
</template>

<script setup lang="ts">
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
  }
})

</script>

<style scoped>

</style>
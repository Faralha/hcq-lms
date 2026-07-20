<template>
  <Header />
  
  
  <UContainer class="py-6 max-w-5xl mt-6 space-y-8 min-h-screen">
    <UButton @click="goBack" icon="i-lucide-arrow-left" variant="outline" color="secondary" size="xl">
      Kembali
    </UButton>

    <slot />
  </UContainer>
</template>

<script setup lang="ts">
const router = useRouter()
const goBack = () => {
    router.back()
  }
</script>
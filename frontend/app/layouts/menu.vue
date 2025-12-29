<template>
  <Header />
  
  
  <UContainer class="py-6 mt-6 space-y-8 min-h-screen">
    <UButton @click="goBack" class="px-0" icon="i-lucide-arrow-left" variant="ghost" color="neutral">
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
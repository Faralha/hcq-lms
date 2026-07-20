<template>
  <div class="flex flex-col justify-center max-w-md mx-auto">
    <UButton label="Kembali" 
      @click="router.back()" 
      size="lg" 
      variant="subtle" 
      icon="i-lucide-arrow-left"
      color="secondary" />
    <UPageCard class="mt-4">
      <AuthChangePasswordModal />
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  ssr: false
})

const router = useRouter();
</script>
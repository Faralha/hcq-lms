<template>
  <UPageCard class="max-w-md p-4">
    <UButton label="Kembali" @click="router.back()" size="lg" variant="ghost" color="secondary" icon="i-lucide-arrow-left" />

    <div class="mb-4">
      <h1 class="text-3xl font-bold">Ubah Password</h1>
      <p class="text-lg text-muted">Ubah password dengan memasukkan sandi lama dan sandi baru.</p>
    </div>

    <AuthChangePasswordModal />
  </UPageCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  ssr: false
})

const router = useRouter()
</script>
<template>
  <UContainer class="py-4 space-y-8">
    
    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Personalia</h1>
    </div>

    <!-- Content -->
    <MenuSection title="Menu" :items="menuItems" />

  </UContainer>
</template>

<script setup lang=ts>
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
  layout: 'menu'
})

// Menu Items
const menuItems: MenuItem[] = [
  {
    label: 'Biaya SPP Pendidikan',
    description: 'Atur Biaya SPP Pendidikan',
    icon: 'i-lucide-credit-card',
    to: '/admin/spp'
  },
  {
    label: 'Gaji Pengajar',
    description: 'Atur Gaji Pengajar',
    icon: 'i-lucide-wallet',
    to: '/admin/gaji'
  }
] 
</script>

<style scoped>

</style>
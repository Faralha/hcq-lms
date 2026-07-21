<template>
  <div class="py-4 space-y-8">

    <!-- Dashboard Greetings -->
    <div>
      <p class="text-lg font-medium ">{{ user?.role }}</p>
      <h1 class="text-3xl font-bold">Hello, {{ user?.nama ? user?.nama : 'User' }}!</h1>
      <p className="text-lg font-medium">{{ clockNow }}</p>
    </div>

    <!-- Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <DashboardActiveSemester />
      <DashboardTotalClassesCard />
    </div>

    <!-- TODO: Show list kelas -->
    <PengajarDaftarKelasList basePath="/pelajar/kelas" />
     
    <!-- Menu Section -->
    <MenuSection title="Menu" :items="menuItems" />

  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
})

const { user } = useAuth()

// Menu items
const menuItems: MenuItem[] = [
  {
    label: 'Kelas',
    description: 'Lihat Kelas aktif yang diambil',
    icon: 'i-lucide-book',
    to: '/pelajar/kelas'
  },
  {
    label: 'Nilai',
    description: 'Lihat nilai yang sudah keluar',
    icon: 'i-lucide-clipboard-check',
    to: '/pelajar/nilai'
  },
  {
    label: 'Tagihan SPP',
    description: 'Lihat dan bayar tagihan SPP',
    icon: 'i-lucide-banknote',
    to: '/pelajar/spp'
  },
  {
    label: 'Rapor',
    description: 'Lihat dan unduh rapor semester',
    icon: 'i-lucide-file-text',
    to: '/pelajar/rapor'
  }
]

// Reactive clock
const clockNow = ref('')

const updateClock = () => {
  const now = new Date()
  clockNow.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// Update clock setiap detik
onMounted(() => {
  updateClock() // Set initial value
  const interval = setInterval(updateClock, 1000)

  // Cleanup interval saat component unmounted
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

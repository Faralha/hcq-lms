<template>
  <!-- Dashboard Greetings -->
  <div>
    <p class="text-lg font-medium ">{{ user?.role }}</p>
    <h1 class="text-3xl font-bold">Hello, {{ user?.nama ? user?.nama : 'User' }}!</h1>
    <p className="text-lg font-medium">{{ clockNow }}</p>
  </div>

  <!-- Overview -->
  <!-- TO-DO: Add pengajar overview such as active semester, available course, etc -->

  <!-- Menu Section -->
  <MenuSection title="Menu" :items="menuItems" />
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { user } = useAuth()

// Menu items
const menuItems: MenuItem[] = [
  {
    label: 'Mata Pelajaran',
    description: 'Lihat dan kelola mata pelajaran yang Anda ajar',
    icon: 'i-lucide-book',
    to: '/pengajar/mata-pelajaran'
  },
  {
    label: 'Presensi',
    description: 'Kelola presensi siswa',
    icon: 'i-lucide-qr-code',
    to: '/pengajar/presensi'
  },
  {
    label: 'Nilai',
    description: 'Input dan kelola nilai siswa',
    icon: 'i-lucide-clipboard-check',
    to: '/pengajar/nilai'
  },
  {
    label: 'Jadwal Mengajar',
    description: 'Lihat jadwal mengajar Anda',
    icon: 'i-lucide-calendar',
    to: '/pengajar/jadwal'
  },
  {
    label: 'Gaji',
    description: 'Riwayat gaji dan slip gaji',
    icon: 'i-lucide-banknote',
    to: '/pengajar/gaji'
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

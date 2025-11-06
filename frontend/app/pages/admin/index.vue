<template>
  <UContainer class="py-4 space-y-8">

    <!-- Dashboard Greetings -->
    <div>
      <p class="text-lg font-medium ">{{ user?.role }}</p>
      <h1 class="text-3xl font-bold">Hello, {{ user?.nama ? user?.nama : 'User' }}!</h1>
      <p className="text-lg font-medium">{{ clockNow }}</p>
    </div>

    <!-- Overview -->
    <!-- TO-DO: Add admin overview such as active semester, available course, etc -->

    <!-- Menu Section -->
    <MenuSection title="Menu" :items="menuItems" />


  </UContainer>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
  layout: 'admin',
})

const { user, logout } = useAuth()
const toast = useToast()

// Menu items
const menuItems: MenuItem[] = [
  {
    label: 'Pengguna',
    description: 'Atur Pengguna',
    icon: 'i-lucide-users',
    to: '/admin/users'
  },
  {
    label: 'Semester',
    description: 'Atur Semester',
    icon: 'i-lucide-calendar-cog',
    to: '/admin/semester'
  },
  {
    label: 'Mata Pelajaran',
    description: 'Atur Mata Pelajaran',
    icon: 'i-lucide-book',
    to: '/admin/mata-pelajaran'
  },
  {
    label: 'Enrollment',
    description: 'Atur Enrollment',
    icon: 'i-lucide-calendar-plus',
    to: '/admin/enrollment'
  },
  {
    label: 'Personalia',
    description: 'Atur Personalia',
    icon: 'i-lucide-banknote',
    to: '/admin/personalia'
  },
  {
    label: 'Laporan',
    description: 'Lihat Laporan',
    icon: 'i-lucide-chart-no-axes-combined',
    to: '/admin/laporan'
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

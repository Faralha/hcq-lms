<template>
  <UDashboardSidebar 
    :mode="mode"
    class="bg-default w-auto"
  >
    <template #header>
      <img src="/hcq.png" class="h-10 w-auto" />
    </template>

    <UNavigationMenu :items="items" orientation="vertical" />
  </UDashboardSidebar>

  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Dashboard" />
    </template>
  </UDashboardPanel>
</template>


<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { user, userRole, logout } = useAuth()
const toast = useToast()

const handleLogout = async () => {
  try {
    await logout()
    toast.add({
      title: 'Logout Berhasil',
      description: 'Sampai jumpa lagi!',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (error) {
    console.error('Logout error:', error)
    toast.add({
      title: 'Logout Gagal',
      description: 'Terjadi kesalahan saat logout',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
}

const items = computed<NavigationMenuItem[]>(() => {
  // Admin menu items
  if (userRole.value === 'ADMIN') {
    return [
      {
        label: 'Dashboard',
        to: '/admin',
        icon: 'i-lucide-layout-dashboard',
        active: route.path === '/admin'
      },
      {
        label: 'Management',
        icon: 'i-lucide-graduation-cap',
        open: true,
        children: [
          {
            label: 'Pengguna',
            to: '/admin/pengguna',
            icon: 'i-lucide-users',
            active: route.path.startsWith('/admin/pengguna')
          },
          {
            label: 'Semester',
            to: '/admin/semester',
            icon: 'i-lucide-calendar',
            active: route.path.startsWith('/admin/semester')
          },
          {
            label: 'Mata Pelajaran',
            to: '/admin/mata-pelajaran',
            icon: 'i-lucide-book',
            active: route.path.startsWith('/admin/mata-pelajaran')
          }
        ]
      },
      {
        label: 'Enrollment',
        to: '/admin/kelas',
        icon: 'i-lucide-calendar-plus',
        active: route.path.startsWith('/admin/kelas')
      },
      {
        label: 'Laporan',
        to: '/admin/laporan',
        icon: 'i-lucide-file-text',
        active: route.path.startsWith('/admin/laporan')
      },
      {
        label: 'Personalia/HRD',
        to: '/admin/personalia',
        icon: 'i-lucide-briefcase',
        active: route.path.startsWith('/admin/personalia')
      }
    ]
  }

  // Pengajar menu items (match app/pages/pengajar/index.vue)
  if (userRole.value === 'PENGAJAR') {
    return [
      {
        label: 'Dashboard',
        to: '/pengajar',
        icon: 'i-lucide-layout-dashboard',
        active: route.path === '/pengajar'
      },
      {
        label: 'Kelas',
        description: 'Lihat dan kelola Kelas yang Anda ajar',
        to: '/pengajar/kelas',
        icon: 'i-lucide-book',
        active: route.path.startsWith('/pengajar/kelas')
      },
      {
        label: 'Nilai',
        description: 'Input dan kelola nilai siswa',
        to: '/pengajar/nilai',
        icon: 'i-lucide-clipboard-check',
        active: route.path.startsWith('/pengajar/nilai')
      },
      {
        label: 'Jadwal Mengajar',
        description: 'Lihat jadwal mengajar Anda',
        to: '/pengajar/jadwal',
        icon: 'i-lucide-calendar',
        active: route.path.startsWith('/pengajar/jadwal')
      },
      {
        label: 'Gaji',
        description: 'Riwayat gaji dan slip gaji',
        to: '/pengajar/gaji',
        icon: 'i-lucide-banknote',
        active: route.path.startsWith('/pengajar/gaji')
      }
    ]
  }

  // Pelajar menu items (match app/pages/pelajar/index.vue)
  if (userRole.value === 'PELAJAR') {
    return [
      {
        label: 'Dashboard',
        to: '/pelajar',
        icon: 'i-lucide-layout-dashboard',
        active: route.path === '/pelajar'
      },
      {
        label: 'Kelas',
        description: 'Lihat Kelas aktif yang diambil',
        to: '/pelajar/kelas',
        icon: 'i-lucide-book',
        active: route.path.startsWith('/pelajar/kelas')
      },
      {
        label: 'Nilai',
        description: 'Lihat nilai yang sudah keluar',
        to: '/pelajar/nilai',
        icon: 'i-lucide-clipboard-check',
        active: route.path.startsWith('/pelajar/nilai')
      },
      {
        label: 'Tagihan SPP',
        description: 'Lihat dan bayar tagihan SPP',
        to: '/pelajar/spp',
        icon: 'i-lucide-banknote',
        active: route.path.startsWith('/pelajar/spp')
      },
      {
        label: 'Rapor',
        description: 'Lihat dan unduh rapor semester',
        to: '/pelajar/rapor',
        icon: 'i-lucide-file-text',
        active: route.path.startsWith('/pelajar/rapor')
      }
    ]
  }

  // Default/guest menu items
  return [
    {
      label: 'Home',
      to: '/',
      icon: 'i-lucide-home',
      active: route.path === '/'
    },
    {
      label: 'Login',
      to: '/auth/login',
      icon: 'i-lucide-log-in',
      active: route.path === '/auth/login'
    }
  ]
})

defineProps<{
  mode: 'drawer' | 'slideover' | 'modal'
}>()
</script>
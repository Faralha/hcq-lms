<template>
  <UHeader title="myLMS" toggle-side="right">
    <!-- <template #title>
      <Logo class="h-6 w-auto" />
    </template> -->

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <div class="flex flex-col min-h-full">
        <div class="flex-1">
          <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </div>

        <USeparator />

        <div class="mt-auto pt-4 ">
          <UButton v-if="user" label="Logout" icon="i-lucide-log-out" color="error" variant="solid" block
            @click="handleLogout" />
        </div>
      </div>
    </template>



  </UHeader>
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
            label: 'Users',
            to: '/admin/users',
            icon: 'i-lucide-users',
            active: route.path.startsWith('/admin/users')
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
            icon: 'i-lucide-book-marked',
            active: route.path.startsWith('/admin/mata-pelajaran')
          }
        ]
      },
      {
        label: 'Enrollment',
        to: '/admin/enrollment',
        icon: 'i-lucide-calendar-plus',
        active: route.path.startsWith('/admin/enrollment')
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

  // Pengajar menu items
  if (userRole.value === 'PENGAJAR') {
    return [
      {
        label: 'Dashboard',
        to: '/pengajar',
        icon: 'i-lucide-layout-dashboard',
        active: route.path === '/pengajar'
      },
      {
        label: 'Mata Pelajaran',
        to: '/pengajar/mata-pelajaran',
        icon: 'i-lucide-book',
        active: route.path.startsWith('/pengajar/mata-pelajaran')
        // TODO: Submenu for class, fetch from backend
      },
      {
        label: 'Pengunguman',
        to: '/pengajar/announcements',
        icon: 'i-lucide-megaphone',
        active: route.path.startsWith('/pengajar/announcements')
      },
      {
        label: 'Presensi',
        to: '/pengajar/presensi',
        icon: 'i-lucide-qr-code',
        active: route.path.startsWith('/pengajar/presensi')
      },
      {
        label: 'Nilai',
        to: '/pengajar/nilai',
        icon: 'i-lucide-clipboard-check',
        active: route.path.startsWith('/pengajar/nilai')
      },
      {
        label: 'Jadwal Mengajar',
        to: '/pengajar/jadwal',
        icon: 'i-lucide-calendar-check',
        active: route.path.startsWith('/pengajar/jadwal')
      },
      {
        label: 'Gaji',
        to: '/pengajar/gaji',
        icon: 'i-lucide-banknote',
        active: route.path.startsWith('/pengajar/gaji')
      },
    ]
  }

  // Pelajar menu items
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
        to: '/pelajar/kelas',
        icon: 'i-lucide-book-open',
        active: route.path.startsWith('/pelajar/kelas')
      },
      {
        label: 'Nilai',
        to: '/pelajar/nilai',
        icon: 'i-lucide-trophy',
        active: route.path.startsWith('/pelajar/nilai')
      },
      {
        label: 'Announcements',
        to: '/pelajar/announcements',
        icon: 'i-lucide-megaphone',
        active: route.path.startsWith('/pelajar/announcements')
      },
      {
        label: 'Biaya Pendidikan (SPP)',
        to: '/pelajar/spp',
        icon: 'i-lucide-banknote',
        active: route.path.startsWith('/pelajar/spp')
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
    }
  ]
})
</script>
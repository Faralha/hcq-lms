<template>
  <UHeader toggle-side="right" :ui="{
    left: 'md:flex-none lg:flex-none',
    center: 'md:flex-1 justify-start hidden md:flex',
    right: 'md:flex-none',
    toggle: 'md:hidden',
  }">
    <template #title>
      <img src="/hcq.png" class="h-10 w-auto" />
    </template>

    <UNavigationMenu :items="items" class="justify-start items-between" />

    <template #right>
      <UColorModeButton />
      <UButton v-if="user" icon="i-lucide-log-out" color="error" variant="solid" block class="w-auto"
        @click="handleLogout" />
      <UButton v-else label="Login" icon="i-lucide-log-in" color="primary" variant="solid" block class="w-auto"
        :to="{ path: '/auth/login' }" />
    </template>

    <!-- Popup for mobile -->
    <template #body>
      <div class="flex flex-col min-h-full">
        <div class="flex-1">
          <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </div>

        <USeparator />

        <div class="mt-auto pt-4 ">
          <UButton v-if="user" label="Logout" icon="i-lucide-log-out" color="error" variant="solid" block
            @click="handleLogout" />
          <UButton v-else label="Login" icon="i-lucide-log-in" color="primary" variant="solid" block class="w-auto"
            :to="{ path: '/auth/login' }" />
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
  // General menu
  const menu: NavigationMenuItem[] = [
    {
      label: 'Home',
      to: '/',
      active: route.path === '/'
    },
    {
      label: 'About',
      to: '/about',
      active: route.path === '/about'
    },
    {
      label: 'Ubah Password',
      to: '/auth/change-password',
    }
  ]

  // Admin menu items
  if (userRole.value === 'ADMIN') {
    menu.push({
      label: 'Bantuan',
      to: '/admin/help',
      active: route.path === '/admin/help'
    })
  }

  // Pengajar menu items
  if (userRole.value === 'PENGAJAR') {
    menu.push({
      label: 'Bantuan',
      to: '/pengajar/help',
      active: route.path === '/pengajar/help'
    })
  }

  // Pelajar menu items (match app/pages/pelajar/index.vue)
  if (userRole.value === 'PELAJAR') {
    menu.push({
      label: 'Bantuan',
      to: '/pelajar/help',
      active: route.path === '/pelajar/help'
    })
  }

  return menu
})
</script>
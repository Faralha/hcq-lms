<template>
  <div class="p-8">
    <UPageCard>
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold">Dashboard Pelajar</h1>
          <p class="text-gray-600 mt-2">Selamat datang, {{ user?.fullName }}</p>
        </div>
        <UButton color="error" variant="outline" @click="handleLogout" icon="i-lucide-log-out">
          Logout
        </UButton>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 rounded-lg">
              <UIcon name="i-lucide-book" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Kelas Saya</p>
              <p class="text-2xl font-bold">-</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 rounded-lg">
              <UIcon name="i-lucide-check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Kehadiran</p>
              <p class="text-2xl font-bold">-%</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-purple-100 rounded-lg">
              <UIcon name="i-lucide-trophy" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Rata-rata Nilai</p>
              <p class="text-2xl font-bold">-</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UButton size="lg" block color="primary" icon="i-lucide-clipboard-check">
            Presensi
          </UButton>
          <UButton size="lg" block color="primary" variant="outline" icon="i-lucide-book-open">
            Lihat Materi
          </UButton>
          <UButton size="lg" block color="primary" variant="outline" icon="i-lucide-award">
            Lihat Nilai
          </UButton>
          <UButton size="lg" block color="primary" variant="outline" icon="i-lucide-calendar">
            Jadwal Kelas
          </UButton>
          <UButton size="lg" block color="primary" variant="outline" icon="i-lucide-megaphone">
            Pengumuman
          </UButton>
          <UButton size="lg" block color="primary" variant="outline" icon="i-lucide-banknote">
            Tagihan SPP
          </UButton>
        </div>
      </div>

      <!-- Role Info -->
      <div class="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-purple-600" />
          <p class="text-sm text-purple-800">
            <strong>Role:</strong> {{ user?.role }} - Anda hanya dapat mengakses halaman /pelajar/* dan /auth/*
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'pelajar'],
  layout: 'default',
  ssr: false, // Disable SSR - cookies only available on client-side
})

const { user, logout } = useAuth()
const toast = useToast()

const handleLogout = async () => {
  try {
    await logout()
    toast.add({
      title: 'Logout Berhasil',
      description: 'Sampai jumpa lagi!',
      color: 'success',
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

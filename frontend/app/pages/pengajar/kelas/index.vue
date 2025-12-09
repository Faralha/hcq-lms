<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Lihat Kelas Ajar</h1>
      <p class="text-lg font-medium text-[--ui-text-muted]">{{ activeSemester }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="kelasMenuItems.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Tidak ada kelas tersedia</p>
      <p class="text-sm text-[--ui-text-muted]">Anda belum memiliki kelas untuk semester ini</p>
    </div>

    <!-- Kelas Cards -->
    <MenuSection v-else title="Daftar Kelas" :items="kelasMenuItems" />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'
import type { Kelas } from '~/composables/useKelasApi'

const toast = useToast()

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false
})

// Composables
const { getAllSemesters } = useSemesterApi()
const { getAllKelas } = useKelasApi()

// State
const isLoading = ref(true)
const activeSemester = ref('')
const kelasList = ref<Kelas[]>([])

// Computed
const kelasMenuItems = computed<MenuItem[]>(() => {
  return kelasList.value.map(kelas => ({
    label: kelas.namaKelas,
    description: `${kelas.mataPelajaran?.nama || 'Mata Pelajaran'} • ${kelas.jadwalHari} ${kelas.jadwalJam} • ${kelas._count?.enrollments || 0} siswa`,
    icon: 'i-lucide-school',
    to: `/pengajar/kelas/${kelas.id}`
  }))
})

// Fetch Data
async function fetchData() {
  isLoading.value = true
  try {
    console.log('[KELAS] Fetching data...')

    // Fetch in parallel
    const [semesters, kelas] = await Promise.all([
      getAllSemesters(),
      getAllKelas()
    ])

    console.log('[KELAS] Semesters:', semesters)
    console.log('[KELAS] Kelas:', kelas)

    // Find active semester
    const activeSemesterData = Array.isArray(semesters)
      ? semesters.find(s => s.status === 'AKTIF')
      : null

    activeSemester.value = activeSemesterData?.nama || 'Tidak ada semester aktif'

    // Set kelas list
    if (Array.isArray(kelas)) {
      kelasList.value = kelas
    } else {
      kelasList.value = []
      throw new Error('Invalid kelas data format')
    }

  } catch (error: any) {
    console.error('[KELAS] Error fetching data:', error)
    toast.add({
      title: 'Error loading kelas',
      description: error.message || 'Failed to fetch kelas data',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
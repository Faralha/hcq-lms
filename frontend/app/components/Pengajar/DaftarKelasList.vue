<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="kelasMenuItems.length === 0" class="px-6 py-6 bg-default border border-default rounded-[10px] text-center">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Tidak ada kelas tersedia</p>
      <p class="text-sm text-[--ui-text-muted]">Anda belum memiliki kelas untuk semester ini</p>
    </div>

    <!-- Kelas Cards -->
    <MenuSection v-else :title="title" :items="kelasMenuItems" />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'
import type { Kelas } from '~/composables/useKelasApi'

const props = withDefaults(defineProps<{
  title?: string
  basePath?: string
}>(), {
  title: 'Daftar Kelas',
  basePath: '/pengajar/kelas'
})

const toast = useToast()

// Composables
const { getAllKelas } = useKelasApi()

// State
const isLoading = ref(true)
const kelasList = ref<Kelas[]>([])

// Computed
const kelasMenuItems = computed<MenuItem[]>(() => {
  return kelasList.value.map(kelas => {
    // Count only students (PELAJAR role) from enrollments
    const siswaCount = kelas.enrollments?.filter((enrollment: any) => enrollment.user?.role === 'PELAJAR').length || 0

    return {
      label: kelas.namaKelas,
      description: `${kelas.mataPelajaran?.nama || 'Mata Pelajaran'} • ${kelas.jadwalHari} ${kelas.jadwalJam} • ${siswaCount} siswa`,
      icon: 'i-lucide-school',
      to: `${props.basePath}/${kelas.id}`
    }
  })
})

// Fetch Data
async function fetchKelas() {
  isLoading.value = true
  try {
    console.log('[DAFTAR KELAS] Fetching kelas...')
    const kelasRes = await getAllKelas()

    console.log('[DAFTAR KELAS] Kelas:', kelasRes)

    const kelas = kelasRes.status === 200 ? kelasRes.data : []

    // Set kelas list
    if (Array.isArray(kelas)) {
      kelasList.value = kelas
    } else {
      kelasList.value = []
      throw new Error('Invalid kelas data format')
    }

  } catch (error: any) {
    console.error('[DAFTAR KELAS] Error fetching data:', error)
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

// Expose refresh method
defineExpose({
  refresh: fetchKelas
})

// Fetch on mount
onMounted(() => {
  fetchKelas()
})
</script>

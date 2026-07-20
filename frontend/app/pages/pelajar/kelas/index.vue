<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">Lihat Kelas Aktif</h1>
      <p class="text-lg font-medium text-[--ui-text-muted]">{{ activeSemester }}</p>
    </div>

    <!-- Daftar Kelas Component -->
    <PengajarDaftarKelasList base-path="/pelajar/kelas" ref="kelasListComponent" title="Daftar Kelas" />
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false
})

// Composables
const { getAllSemesters } = useSemesterApi()

// State
const activeSemester = ref('')

// Fetch Data
async function fetchActiveSemester() {
  try {
    console.log('[KELAS] Fetching active semester...')
    const semestersRes = await getAllSemesters()

    console.log('[KELAS] Semesters:', semestersRes)

    const semesters = semestersRes.status === 200 ? semestersRes.data : []

    // Find active semester
    const activeSemesterData = Array.isArray(semesters)
      ? semesters.find((s: any) => s.status === 'AKTIF')
      : null

    activeSemester.value = activeSemesterData?.nama || 'Tidak ada semester aktif'

  } catch (error: any) {
    console.error('[KELAS] Error fetching semester:', error)
    toast.add({
      title: 'Error loading semester',
      description: error.message || 'Failed to fetch semester data',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  fetchActiveSemester()
})
</script>
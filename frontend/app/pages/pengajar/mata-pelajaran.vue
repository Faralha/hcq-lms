<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Atur Mata Pelajaran</h1>
      <p class="text-lg font-medium text-[--ui-text-muted]">{{ data.activeSemester }}</p>
    </div>

    <!-- AddNilaiModal -->

    <!-- TableView -->
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

definePageMeta({
  layout: 'menu',
  middleware: 'auth'
})

// Composables
const { getAllSemesters } = useSemesterApi()

// Data
const data = ref({
  activeSemester: ''
})

// Fetch Data
async function fetchData() {
  try {
    // Fetch in parallel
    const [semesters] = await Promise.all([
      getAllSemesters()
    ])

    // Find active semester
    const activeSemester = semesters.find(s => s.status === 'AKTIF')

    data.value = {
      activeSemester: activeSemester?.nama || 'Tidak ada'
    }
  } catch (error: any) {
    console.error('[MataPelajaran] Error fetching data:', error)
    toast.add({
      title: 'Error loading dashboard',
      description: error.message || 'Failed to fetch dashboard data',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>

</style>
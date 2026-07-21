<template>
  <!-- Active Semester Card -->
  <UPageCard title="Semester Aktif" :description="stats.activeSemester || 'Tidak ada'"
    icon="i-lucide-calendar-check" variant="outline">
    <template #footer>
      <p class="text-xs text-[--ui-text-muted]">Semester berjalan saat ini</p>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">

const toast = useToast();
const stats = ref({
  activeSemester: '',
  upcomingSemester: ''
})

async function fetchActiveSemester() {
  try {
    const { getAllSemesters } = useSemesterApi();
    const [semestersRes] = await Promise.all([
      getAllSemesters()
    ])

    const semesters = semestersRes.status === 200 && semestersRes.data ? semestersRes.data : [];
    const activeSemester = semesters.find(s => s.status === 'AKTIF');
    const upcomingSemester = semesters.find(s => s.status === 'MENDATANG');

    stats.value = {
      activeSemester: activeSemester?.nama || 'Tidak ada',
      upcomingSemester: upcomingSemester?.nama || 'Tidak ada'
    }
  } catch (error: any) {
    console.error('[ActiveSemester] Failed to fetch semesters:', error);
    toast.add({
      title: 'Error loading semesters',
      description: error.message || 'Gagal memuat data semester',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  fetchActiveSemester();
})

</script>
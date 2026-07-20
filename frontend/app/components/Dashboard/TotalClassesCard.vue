<template>
  <UPageCard title="Total Kelas" :description="totalClasses" icon="i-lucide-school" variant="outline">
    <template #footer>
      <p class="text-xs text-[--ui-text-muted]">Kelas yang tersedia</p>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
const toast = useToast();
const totalClasses = ref('0');

async function fetchTotalClasses() {
  try {
    const { getAllKelas } = useKelasApi();
    const res = await getAllKelas();
    totalClasses.value = (res.status === 200 && res.data ? res.data.length : 0).toString();
  } catch (error: any) {
    console.error('[TotalClassesCard] Failed to fetch classes:', error);
    toast.add({
      title: 'Error loading classes',
      description: error.message || 'Gagal memuat data kelas',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  }
}

onMounted(() => {
  fetchTotalClasses();
});
</script>

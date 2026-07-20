<template>
  <UPageCard title="Pelajar" class="max-md:hidden" :description="totalStudents" icon="i-lucide-users" variant="outline">
    <template #footer>
      <p class="text-xs text-[--ui-text-muted]">Pelajar terdaftar</p>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
const toast = useToast();
const totalStudents = ref('0');

async function fetchTotalStudents() {
  try {
    const { getAllUsers } = useUserApi();
    const res = await getAllUsers();
    const students = res.status === 200 && res.data ? res.data.filter((u: any) => u.role === 'PELAJAR') : [];
    totalStudents.value = students.length.toString();
  } catch (error: any) {
    console.error('[TotalStudentsCard] Failed to fetch students:', error);
    toast.add({
      title: 'Error loading students',
      description: error.message || 'Gagal memuat data pelajar',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  }
}

onMounted(() => {
  fetchTotalStudents();
});
</script>

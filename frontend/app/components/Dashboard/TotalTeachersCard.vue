<template>
  <UPageCard title="Pengajar" class="max-md:hidden" :description="totalTeachers" icon="i-lucide-user-check"
    variant="outline">
    <template #footer>
      <p class="text-xs text-[--ui-text-muted]">Pengajar aktif</p>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
const toast = useToast();
const totalTeachers = ref('0');

async function fetchTotalTeachers() {
  try {
    const { getAllUsers } = useUserApi();
    const res = await getAllUsers();
    const teachers = res.status === 200 && res.data ? res.data.filter((u: any) => u.role === 'PENGAJAR') : [];
    totalTeachers.value = teachers.length.toString();
  } catch (error: any) {
    console.error('[TotalTeachersCard] Failed to fetch teachers:', error);
    toast.add({
      title: 'Error loading teachers',
      description: error.message || 'Gagal memuat data pengajar',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  }
}

onMounted(() => {
  fetchTotalTeachers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div>
      <h1 class="text-3xl font-bold">Nilai Saya</h1>
      <p class="text-[--ui-text-muted] mt-1">Lihat nilai dari semua kelas yang diikuti</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingNilai" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!myNilaiData || myNilaiData.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-clipboard-list" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada nilai</p>
      <p class="text-sm text-[--ui-text-muted]">Nilai Anda akan muncul di sini</p>
    </div>

    <!-- Nilai Tables Grouped by Semester -->
    <div v-else class="space-y-8">
      <div v-for="(group, semester) in nilaiGroupedBySemester" :key="semester" class="space-y-4">
        <!-- Semester Header -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
          <h2 class="text-xl font-semibold">{{ semester }}</h2>
        </div>

        <!-- Nilai Table for this semester -->
        <UTable :data="group.tableData" :columns="nilaiColumns"
          class="border border-accented rounded-lg overflow-x-auto" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Kelas } from '~/composables/useKelasApi'
import type { Nilai } from '~/types/entities'

interface MyNilai {
  kelas: Kelas
  nilaiList: Nilai[]
}

definePageMeta({
  layout: 'menu',
  middleware: ['auth', 'pelajar']
})

const toast = useToast()

// Composables
const { getMyNilai } = useNilaiApi()

// State
const isLoadingNilai = ref(false)
const myNilaiData = ref<MyNilai[]>([])

// Group nilai by semester
const nilaiGroupedBySemester = computed(() => {
  if (!myNilaiData.value || myNilaiData.value.length === 0) return {}

  const grouped: Record<string, { tableData: any[] }> = {}

  myNilaiData.value.forEach((myNilai: MyNilai) => {
    const semesterName = myNilai.kelas.semester?.nama || 'Semester Tidak Diketahui'

    if (!grouped[semesterName]) {
      grouped[semesterName] = { tableData: [] }
    }

    const mataPelajaranNama = myNilai.kelas.mataPelajaran?.nama || myNilai.kelas.namaKelas

    // Calculate cumulative grade
    let totalNilai = 0
    let totalBobot = 0

    myNilai.nilaiList.forEach((nilai: Nilai) => {
      if (nilai.komponen && nilai.komponen.bobot) {
        const bobot = nilai.komponen.bobot
        totalNilai += (nilai.nilai * bobot / 100)
        totalBobot += bobot
      }
    })

    // Calculate final cumulative grade
    const nilaiKumulatif = totalBobot > 0 ? (totalNilai / totalBobot * 100) : 0

    grouped[semesterName].tableData.push({
      no: grouped[semesterName].tableData.length + 1,
      kelasId: myNilai.kelas.id,
      mataPelajaran: mataPelajaranNama,
      nilaiKumulatif: Math.round(nilaiKumulatif * 100) / 100
    })
  })

  return grouped
})

// Transform nilai data for table
// Rows = Courses (Mata Pelajaran)
// Columns = No., Mata Pelajaran, Nilai Kumulatif
const nilaiTableData = computed(() => {
  if (!myNilaiData.value || myNilaiData.value.length === 0) return []

  return myNilaiData.value.map((myNilai: MyNilai, index: number) => {
    const mataPelajaranNama = myNilai.kelas.mataPelajaran?.nama || myNilai.kelas.namaKelas

    // Calculate cumulative grade
    let totalNilai = 0
    let totalBobot = 0

    myNilai.nilaiList.forEach((nilai: Nilai) => {
      if (nilai.komponen && nilai.komponen.bobot) {
        const bobot = nilai.komponen.bobot
        totalNilai += (nilai.nilai * bobot / 100)
        totalBobot += bobot
      }
    })

    // Calculate final cumulative grade
    const nilaiKumulatif = totalBobot > 0 ? (totalNilai / totalBobot * 100) : 0

    return {
      no: index + 1,
      kelasId: myNilai.kelas.id,
      mataPelajaran: mataPelajaranNama,
      nilaiKumulatif: Math.round(nilaiKumulatif * 100) / 100 // Round to 2 decimal places
    }
  })
})

// Generate columns for nilai table
const nilaiColumns = computed<TableColumn<any>[]>(() => {
  return [
    {
      accessorKey: 'no',
      header: 'No.',
      cell: ({ row }) => h('div', { class: 'text-center' }, row.getValue('no'))
    },
    {
      accessorKey: 'mataPelajaran',
      header: 'Mata Pelajaran',
      cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.getValue('mataPelajaran'))
    },
    {
      accessorKey: 'nilaiKumulatif',
      header: 'Nilai Kumulatif',
      cell: ({ row }) => {
        const nilai = row.getValue('nilaiKumulatif') as number
        return h('div', { class: 'font-medium text-highlighted text-center' }, nilai.toFixed(2))
      }
    }
  ]
})

// Fetch my nilai
async function fetchMyNilai() {
  try {
    isLoadingNilai.value = true
    const response = await getMyNilai()
    myNilaiData.value = response.data || []
  } catch (error: any) {
    console.error('Error fetching nilai:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data nilai',
      color: 'error'
    })
    myNilaiData.value = []
  } finally {
    isLoadingNilai.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchMyNilai()
})
</script>

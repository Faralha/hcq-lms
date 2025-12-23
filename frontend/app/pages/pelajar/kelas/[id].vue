<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ kelasData?.namaKelas || 'Loading...' }}</h1>
        <p v-if="kelasData" class="text-[--ui-text-muted] mt-1">
          {{ kelasData.mataPelajaran?.nama }} - Semester {{ kelasData.semester?.nama }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingKelas" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <template v-else>
      <!-- Presensi Section -->
      <div>
        <PelajarKelasPresensi ref="presensiComponent" :kelas-id="kelasId" />
      </div>

      <!-- Announcements Section -->
      <div>
        <PelajarKelasAnnouncement ref="announcementComponent" :kelas-id="kelasId" />
      </div>

      <!-- Materi Section -->
      <div>
        <PelajarKelasMateri ref="materiComponent" :kelas-id="kelasId" />
      </div>

      <!-- Nilai Section -->
      <div>
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">Nilai Saya</h2>

          <!-- Loading State -->
          <div v-if="isLoadingNilai" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <!-- Empty State -->
          <div v-else-if="!nilaiForKelas || nilaiForKelas.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-clipboard-list" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
            <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada nilai</p>
            <p class="text-sm text-[--ui-text-muted]">Nilai Anda akan muncul di sini</p>
          </div>

          <!-- Nilai Table -->
          <UTable v-else :data="nilaiTableData" :columns="nilaiColumns"
            class="border border-accented rounded-lg overflow-x-auto" />
        </div>
      </div>
    </template>
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

const route = useRoute()
const toast = useToast()

// Composables
const { getKelasById } = useKelasApi()
const { getMyNilai } = useNilaiApi()

// State
const kelasId = computed(() => route.params.id as string)
const kelasData = ref<Kelas | null>(null)
const isLoadingKelas = ref(false)
const isLoadingNilai = ref(false)
const myNilaiData = ref<MyNilai[]>([])

// Component refs
const presensiComponent = useTemplateRef('presensiComponent')
const announcementComponent = useTemplateRef('announcementComponent')
const materiComponent = useTemplateRef('materiComponent')

// Filter nilai for current kelas
const nilaiForKelas = computed(() => {
  return myNilaiData.value.find((item: MyNilai) => item.kelas.id === kelasId.value)?.nilaiList || []
})

// Transform nilai data for table
// Rows = Komponen (ETS, EAS, etc.)
// Columns = Mata Pelajaran names
const nilaiTableData = computed(() => {
  if (!nilaiForKelas.value || nilaiForKelas.value.length === 0) return []

  // Group nilai by komponenId
  const komponenMap = new Map<string, { komponenNama: string; nilaiByMataPelajaran: Map<string, number> }>()

  nilaiForKelas.value.forEach((nilai: Nilai) => {
    if (!nilai.komponen) return
    const komponenId = nilai.komponen.id
    const komponenNama = nilai.komponen.nama
    const mataPelajaranNama = kelasData.value?.mataPelajaran?.nama || '-'
    const nilaiValue = nilai.nilai

    if (!komponenMap.has(komponenId)) {
      komponenMap.set(komponenId, {
        komponenNama,
        nilaiByMataPelajaran: new Map()
      })
    }

    komponenMap.get(komponenId)!.nilaiByMataPelajaran.set(mataPelajaranNama, nilaiValue)
  })

  // Convert to table rows
  return Array.from(komponenMap.entries()).map(([komponenId, data]) => ({
    komponenId,
    komponenNama: data.komponenNama,
    ...Object.fromEntries(data.nilaiByMataPelajaran)
  }))
})

// Generate dynamic columns for nilai table
const nilaiColumns = computed<TableColumn<any>[]>(() => {
  const columns: TableColumn<any>[] = [
    {
      accessorKey: 'komponenNama',
      header: 'Komponen Penilaian',
      cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.getValue('komponenNama'))
    }
  ]

  // Add column for mata pelajaran
  if (kelasData.value?.mataPelajaran?.nama) {
    columns.push({
      accessorKey: kelasData.value.mataPelajaran.nama,
      header: kelasData.value.mataPelajaran.nama,
      cell: ({ row }) => {
        const nilai = row.original[kelasData.value!.mataPelajaran!.nama]
        if (nilai === undefined || nilai === null) {
          return h('div', { class: 'text-[--ui-text-muted]' }, '-')
        }
        return h('div', { class: 'font-medium text-highlighted' }, nilai.toString())
      }
    })
  }

  return columns
})

// Fetch kelas data
async function fetchKelasData() {
  try {
    isLoadingKelas.value = true
    const response = await getKelasById(kelasId.value)
    if (response.data) {
      kelasData.value = response.data
    }
  } catch (error: any) {
    console.error('Error fetching kelas data:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data kelas',
      color: 'error'
    })
  } finally {
    isLoadingKelas.value = false
  }
}

// Fetch my nilai
async function fetchMyNilai() {
  try {
    isLoadingNilai.value = true
    const response = await getMyNilai()
    myNilaiData.value = response.data || []
  } catch (error: any) {
    console.error('Error fetching nilai:', error)
    myNilaiData.value = []
  } finally {
    isLoadingNilai.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await fetchKelasData()
  await fetchMyNilai()
})
</script>

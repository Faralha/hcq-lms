<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import * as z from 'zod'
import type { TableColumn } from '@nuxt/ui'
import type { NilaiByKelas, CreateKomponenRequest, EntryNilaiRequest, UpdateNilaiRequest } from '~/composables/useNilaiApi'
import type { NilaiKomponen, User, Kelas, Nilai } from '~/types/entities'

// Extended interface for komponen with nilai array from API
interface KomponenWithNilai extends NilaiKomponen {
  nilai?: Nilai[]
}

definePageMeta({
  layout: 'menu',
  middleware: ['auth', 'pengajar'],
  ssr: false
})

const route = useRoute()
const kelasId = route.params.id as string

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UInput = resolveComponent('UInput')

// API Composables
const { getNilaiByKelas, createKomponen, entryNilai, updateNilai } = useNilaiApi()
const { getKelasById } = useKelasApi()

// State
const loading = ref(false)
const nilaiData = ref<KomponenWithNilai[]>([])
const kelasData = ref<Kelas | null>(null)

// Modal states
const isCreateKomponenModalOpen = ref(false)
const isEditNilaiModalOpen = ref(false)

// Validation schemas
const komponenSchema = z.object({
  kelasId: z.string(),
  nama: z.string().min(1, 'Nama komponen wajib diisi'),
  bobot: z.number().min(1, 'Bobot minimal 1%').max(100, 'Bobot maksimal 100%')
})

type KomponenSchema = z.output<typeof komponenSchema>

const nilaiSchema = z.object({
  nilaiId: z.string().optional(),
  komponenId: z.string(),
  pelajarId: z.string(),
  nilai: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
  isNew: z.boolean()
})

type NilaiSchema = z.output<typeof nilaiSchema>

// Forms
const createKomponenForm = reactive<KomponenSchema>({
  kelasId,
  nama: '',
  bobot: 0
})

const editNilaiForm = reactive<NilaiSchema>({
  nilaiId: undefined,
  komponenId: '',
  pelajarId: '',
  nilai: 0,
  isNew: true
})

// Computed: merge enrolled students with nilai data
const pelajarListWithNilai = computed(() => {
  console.log('Computing pelajarListWithNilai...')
  console.log('kelasData.value:', kelasData.value)
  console.log('nilaiData.value:', nilaiData.value)

  if (!kelasData.value?.enrollments) {
    console.log('No enrollments found')
    return []
  }

  // Get all enrolled pelajar (students)
  const enrolledPelajar = kelasData.value.enrollments
    .filter((enrollment: any) => enrollment.user?.role === 'PELAJAR')

  console.log('Enrolled pelajar:', enrolledPelajar)

  // Build nilai list for each student from komponen's nilai arrays
  const result = enrolledPelajar.map((enrollment: any) => {
    const pelajarId = enrollment.user.id
    const nilaiList: any[] = []

    // Loop through each komponen and find nilai for this pelajar
    nilaiData.value.forEach((komponen: KomponenWithNilai) => {
      const nilaiEntry = komponen.nilai?.find((n: Nilai) => n.userId === pelajarId)
      if (nilaiEntry) {
        nilaiList.push({
          komponenId: komponen.id,
          nilai: nilaiEntry.nilai,
          id: nilaiEntry.id
        })
      }
    })

    return {
      user: enrollment.user,
      nilaiList
    }
  })

  console.log('Final pelajarListWithNilai:', result)
  return result
})

// Dynamic columns based on komponen list
const columns = computed<TableColumn<any>[]>(() => {
  const baseColumns: TableColumn<any>[] = [
    {
      accessorKey: 'no',
      header: 'No',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.index + 1),
      meta: {
        class: {
          td: 'w-16'
        }
      }
    },
    {
      accessorKey: 'nama',
      header: 'Nama Pelajar',
      cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.original.user.nama),
      meta: {
        class: {
          td: 'min-w-[200px]'
        }
      }
    }
  ]

  // Add dynamic columns for each komponen
  if (nilaiData.value && Array.isArray(nilaiData.value)) {
    nilaiData.value.forEach((komponen: KomponenWithNilai) => {
      baseColumns.push({
        id: `komponen-${komponen.id}`,
        header: () => h('div', { class: 'text-center' }, [
          h('div', { class: 'font-semibold' }, komponen.nama),
          h('div', { class: 'text-xs text-muted font-normal' }, `Bobot: ${komponen.bobot}%`)
        ]),
        cell: ({ row }) => {
          const nilaiEntry = row.original.nilaiList.find((n: any) => n.komponenId === komponen.id)
          const nilai = nilaiEntry?.nilai ?? '-'
          return h('div', { class: 'text-center text-highlighted' }, nilai.toString())
        },
        meta: {
          class: {
            td: 'text-center min-w-[120px]'
          }
        }
      })
    })
  }

  // Actions column
  baseColumns.push({
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      // Safe check for komponenList
      if (!nilaiData.value || !Array.isArray(nilaiData.value) || nilaiData.value.length === 0) {
        return h('div', { class: 'flex justify-end' }, '-')
      }

      const items = nilaiData.value.map((komponen: KomponenWithNilai) => {
        const nilaiEntry = row.original.nilaiList.find((n: any) => n.komponenId === komponen.id)
        return {
          label: `Edit ${komponen.nama}`,
          icon: 'i-lucide-edit',
          onSelect: () => openEditNilaiModal(row.original.user, komponen, nilaiEntry)
        }
      })

      return h('div', { class: 'flex justify-end' },
        h(UDropdownMenu, { items: [items] }, () =>
          h(UButton, {
            icon: 'i-lucide-more-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'sm'
          })
        )
      )
    },
    meta: {
      class: {
        td: 'w-16'
      }
    }
  })

  return baseColumns
})

// Fetch data
async function fetchKelasData() {
  try {
    const response = await getKelasById(kelasId)
    console.log('Kelas API Response:', response)
    if (response.status === 200 && response.data) {
      kelasData.value = response.data
      console.log('Kelas Data:', kelasData.value)
      console.log('Enrollments:', kelasData.value.enrollments)
    }
  } catch (error) {
    console.error('Failed to fetch kelas data:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memuat data kelas',
      color: 'error'
    })
  }
}

async function fetchNilaiData() {
  try {
    const response = await getNilaiByKelas(kelasId)
    console.log('Nilai API Response:', response)
    if (response.status === 200 && response.data) {
      nilaiData.value = response.data as unknown as KomponenWithNilai[]
      console.log('Nilai Data:', nilaiData.value)
    }
  } catch (error) {
    console.error('Failed to fetch nilai data:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memuat data nilai',
      color: 'error'
    })
  }
}

async function fetchAllData() {
  loading.value = true
  try {
    await Promise.all([fetchKelasData(), fetchNilaiData()])
  } finally {
    loading.value = false
  }
}

// Create komponen
async function handleCreateKomponen() {
  loading.value = true
  try {
    const response = await createKomponen(createKomponenForm)
    if (response.status !== 201 && response.status !== 200) {
      throw new Error('Failed to create komponen')
    }

    useToast().add({
      title: 'Success',
      description: 'Komponen penilaian berhasil dibuat',
      color: 'success'
    })

    isCreateKomponenModalOpen.value = false
    resetCreateKomponenForm()
    await fetchAllData()
  } catch (error) {
    console.error('Failed to create komponen:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal membuat komponen penilaian',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle nilai submission
async function handleSubmitNilai() {
  loading.value = true
  try {
    let response

    if (editNilaiForm.isNew) {
      // Entry nilai baru
      const entryData: EntryNilaiRequest = {
        komponenId: editNilaiForm.komponenId,
        pelajarId: editNilaiForm.pelajarId,
        nilai: editNilaiForm.nilai
      }
      response = await entryNilai(entryData)
    } else {
      // Update nilai existing
      if (!editNilaiForm.nilaiId) throw new Error('Nilai ID is required for update')

      const updateData: UpdateNilaiRequest = {
        nilai: editNilaiForm.nilai
      }
      response = await updateNilai(editNilaiForm.nilaiId, updateData)
    }

    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Failed to submit nilai')
    }

    useToast().add({
      title: 'Success',
      description: editNilaiForm.isNew ? 'Nilai berhasil diinput' : 'Nilai berhasil diupdate',
      color: 'success'
    })

    isEditNilaiModalOpen.value = false
    await fetchAllData()
  } catch (error) {
    console.error('Failed to submit nilai:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal menyimpan nilai',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Modal handlers
function openCreateKomponenModal() {
  resetCreateKomponenForm()
  isCreateKomponenModalOpen.value = true
}

function openEditNilaiModal(user: User, komponen: NilaiKomponen, nilaiEntry?: any) {
  editNilaiForm.nilaiId = nilaiEntry?.id
  editNilaiForm.komponenId = komponen.id
  editNilaiForm.pelajarId = user.id
  editNilaiForm.nilai = nilaiEntry?.nilai ?? 0
  editNilaiForm.isNew = !nilaiEntry
  isEditNilaiModalOpen.value = true
}

function resetCreateKomponenForm() {
  createKomponenForm.kelasId = kelasId
  createKomponenForm.nama = ''
  createKomponenForm.bobot = 0
}

// Initialize
onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-highlighted">
          Penilaian - {{ kelasData?.namaKelas }}
        </h1>
        <p class="text-muted mt-1">
          Kelola penilaian siswa untuk kelas ini
        </p>
      </div>

      <UButton label="Tambah Komponen Penilaian" icon="i-lucide-plus" @click="openCreateKomponenModal" />
    </div>

    <!-- Komponen Info -->
    <div v-if="nilaiData?.length" class="flex gap-2 flex-wrap">
      <div v-for="komponen in nilaiData" :key="komponen.id"
        class="px-3 py-2 bg-elevated rounded-lg border border-default">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-clipboard-list" class="size-4 text-primary" />
          <span class="font-medium text-sm">{{ komponen.nama }}</span>
          <span class="text-xs text-muted">{{ komponen.bobot }}%</span>
        </div>
      </div>
    </div>

    <!-- Empty State for Komponen -->
    <div v-else-if="!loading && (!nilaiData || nilaiData.length === 0)"
      class="text-center py-8 border border-dashed border-default rounded-lg">
      <UIcon name="i-lucide-clipboard-list" class="size-12 mx-auto text-muted mb-3" />
      <p class="text-muted mb-4">Belum ada komponen penilaian</p>
      <UButton label="Tambah Komponen Penilaian" icon="i-lucide-plus" size="sm" @click="openCreateKomponenModal" />
    </div>

    <!-- Table -->
    <UTable :data="pelajarListWithNilai" :columns="columns" :loading="loading"
      class="w-full border border-default rounded-lg">
      <template #empty>
        <div class="text-center py-8">
          <UIcon name="i-lucide-users" class="size-12 mx-auto text-muted mb-3" />
          <p class="text-muted">Tidak ada siswa di kelas ini</p>
        </div>
      </template>
    </UTable>

    <!-- Create Komponen Modal -->
    <UModal v-model:open="isCreateKomponenModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Tambah Komponen Penilaian</h3>
          </template>

          <UForm :schema="komponenSchema" :state="createKomponenForm" @submit="handleCreateKomponen" class="space-y-4">
            <UFormField label="Nama Komponen" name="nama" required>
              <UInput v-model="createKomponenForm.nama" placeholder="Contoh: UTS, UAS, Kuis 1" class="w-full" />
            </UFormField>

            <UFormField label="Bobot (%)" name="bobot" required>
              <UInput v-model.number="createKomponenForm.bobot" type="number" placeholder="Contoh: 30" min="0" max="100"
                class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" type="submit" :loading="loading">
                Simpan
              </UButton>
              <UButton class="w-full justify-center" color="neutral" variant="outline"
                @click="isCreateKomponenModalOpen = false">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <!-- Edit Nilai Modal -->
    <UModal v-model:open="isEditNilaiModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ editNilaiForm.isNew ? 'Input' : 'Edit' }} Nilai
            </h3>
          </template>

          <UForm :schema="nilaiSchema" :state="editNilaiForm" @submit="handleSubmitNilai" class="space-y-4">
            <UFormField label="Nilai" name="nilai" required>
              <UInput v-model.number="editNilaiForm.nilai" type="number" placeholder="Masukkan nilai (0-100)" min="0"
                max="100" step="0.01" class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" type="submit" :loading="loading">
                {{ editNilaiForm.isNew ? 'Simpan' : 'Update' }}
              </UButton>
              <UButton class="w-full justify-center" color="neutral" variant="outline"
                @click="isEditNilaiModalOpen = false">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
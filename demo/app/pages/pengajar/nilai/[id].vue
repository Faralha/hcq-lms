<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import * as z from 'zod'
import type { TableColumn } from '@nuxt/ui'
import type { NilaiByKelas, CreateKomponenRequest, EntryNilaiRequest, UpdateNilaiRequest } from '~/composables/useNilaiApi'
import type { NilaiKomponen, User, Kelas, Nilai, AcademicRemark } from '~/types/entities'
import type { CreateAcademicRemarkRequest, UpdateAcademicRemarkRequest } from '~/composables/useAcademicRemarkApi'

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
const UPopover = resolveComponent('UPopover')

// API Composables
const { getNilaiByKelas, createKomponen, editKomponenByKelas, deleteKomponenByKelas, entryNilai, updateNilai } = useNilaiApi()
const { getKelasById } = useKelasApi()
const { getAcademicRemarksByKelas, createAcademicRemark, updateAcademicRemark } = useAcademicRemarkApi()
const { getAllSemesters } = useSemesterApi()

// State
const loading = ref(false)
const nilaiData = ref<KomponenWithNilai[]>([])
const kelasData = ref<Kelas | null>(null)
const remarksData = ref<AcademicRemark[]>([])
const semesters = ref<any[]>([])

// Edit mode state - track which row is being edited
const editingRowId = ref<string | null>(null)
const editingRowValues = ref<{
  nilaiMap: Map<string, number>
  catatan: string
  userId: string
  remarkId?: string
} | null>(null)

// Modal states
const isCreateKomponenModalOpen = ref(false)
const isEditKomponenModalOpen = ref(false)

// Validation schemas
const komponenSchema = z.object({
  kelasId: z.string(),
  nama: z.string().min(1, 'Nama komponen wajib diisi'),
  bobot: z.number().min(1, 'Bobot minimal 1%').max(100, 'Bobot maksimal 100%')
})

type KomponenSchema = z.output<typeof komponenSchema>

const editKomponenSchema = z.object({
  komponenId: z.string(),
  nama: z.string().min(1, 'Nama komponen wajib diisi'),
  bobot: z.number().min(1, 'Bobot minimal 1%').max(100, 'Bobot maksimal 100%')
})

type EditKomponenSchema = z.output<typeof editKomponenSchema>

// Forms
const createKomponenForm = reactive<KomponenSchema>({
  kelasId,
  nama: '',
  bobot: 0
})

const editKomponenForm = reactive<EditKomponenSchema>({
  komponenId: '',
  nama: '',
  bobot: 0
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

    // Find academic remark for this student
    const remark = remarksData.value.find(r => r.userId === pelajarId)

    return {
      user: enrollment.user,
      nilaiList,
      remark
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
          const isEditing = editingRowId.value === row.original.user.id
          const nilaiEntry = row.original.nilaiList.find((n: any) => n.komponenId === komponen.id)

          if (isEditing && editingRowValues.value) {
            const value = editingRowValues.value.nilaiMap.get(komponen.id) ?? nilaiEntry?.nilai ?? 0
            return h('div', { class: 'text-center' },
              h(UInput, {
                modelValue: value,
                'onUpdate:modelValue': (newVal: any) => {
                  if (editingRowValues.value) {
                    editingRowValues.value.nilaiMap.set(komponen.id, parseFloat(newVal) || 0)
                  }
                },
                type: 'number',
                size: 'sm',
                min: 0,
                max: 100,
                step: '0.01',
                class: 'text-center'
              })
            )
          }

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

  // Academic Remark column
  baseColumns.push({
    id: 'remark',
    header: () => h('div', { class: 'text-center' }, 'Catatan Akademik'),
    cell: ({ row }) => {
      const isEditing = editingRowId.value === row.original.user.id
      const remark = row.original.remark
      const hasCatatan = remark?.catatan && remark.catatan !== '-'

      if (isEditing && editingRowValues.value) {
        return h('div', { class: 'text-center' },
          h(UInput, {
            modelValue: editingRowValues.value.catatan,
            'onUpdate:modelValue': (newVal: any) => {
              if (editingRowValues.value) {
                editingRowValues.value.catatan = newVal
              }
            },
            type: 'text',
            size: 'md',
            placeholder: 'Masukkan catatan...'
          })
        )
      }

      if (!hasCatatan) {
        return h('div', { class: 'text-center text-muted text-sm' }, '-')
      }

      return h('div', { class: 'flex justify-center' },
        h(UPopover, {}, {
          default: () => h(UButton, {
            icon: 'i-lucide-eye',
            label: 'Lihat',
            size: 'md',
            color: 'secondary',
            variant: 'solid'
          }),
          content: () => h('div', { class: 'p-4 max-w-md' }, [
            h('div', { class: 'font-semibold text-sm mb-2 text-highlighted' }, 'Catatan Akademik'),
            h('p', { class: 'text-sm text-muted whitespace-pre-wrap' }, remark.catatan)
          ])
        })
      )
    },
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center min-w-[200px]'
      }
    }
  })

  // Actions column
  baseColumns.push({
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const isEditing = editingRowId.value === row.original.user.id

      return h('div', { class: 'flex justify-end' },
        isEditing
          ? h('div', { class: 'flex gap-1' }, [
            h(UButton, {
              label: 'Simpan',
              icon: 'i-lucide-save',
              size: 'md',
              color: 'success',
              variant: 'solid',
              onClick: () => handleSaveRowEdit(row.original.user.id)
            }),
            h(UButton, {
              icon: 'i-lucide-x',
              size: 'md',
              color: 'error',
              variant: 'solid',
              onClick: () => cancelRowEdit()
            })
          ])
          : h(UButton, {
            label: 'Edit',
            icon: 'i-lucide-edit',
            size: 'md',
            color: 'secondary',
            variant: 'outline',
            onClick: () => startRowEdit(row.original.user.id, row.original)
          })
      )
    },
    meta: {
      class: {
        td: 'w-32'
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

async function fetchRemarksData() {
  try {
    const response = await getAcademicRemarksByKelas(kelasId)
    console.log('Remarks API Response:', response)
    if (response.status === 200 && response.data) {
      remarksData.value = response.data
      console.log('Remarks Data:', remarksData.value)
    }
  } catch (error) {
    console.error('Failed to fetch remarks data:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memuat data catatan akademik',
      color: 'error'
    })
  }
}

async function fetchSemesters() {
  try {
    const response = await getAllSemesters()
    if (response.status === 200 && response.data) {
      semesters.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch semesters:', error)
  }
}

async function fetchAllData() {
  loading.value = true
  try {
    await Promise.all([fetchKelasData(), fetchNilaiData(), fetchRemarksData(), fetchSemesters()])
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

// Edit komponen
async function handleEditKomponen() {
  loading.value = true
  try {
    const response = await editKomponenByKelas(editKomponenForm.komponenId, {
      nama: editKomponenForm.nama,
      bobot: editKomponenForm.bobot
    })

    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Failed to edit komponen')
    }

    useToast().add({
      title: 'Success',
      description: 'Komponen penilaian berhasil diperbarui',
      color: 'success'
    })

    isEditKomponenModalOpen.value = false
    await fetchAllData()
  } catch (error) {
    console.error('Failed to edit komponen:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memperbarui komponen penilaian',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Delete komponen
async function handleDeleteKomponen(komponen: NilaiKomponen) {
  const confirmed = confirm(`Apakah Anda yakin ingin menghapus komponen "${komponen.nama}"?`)
  if (!confirmed) return

  loading.value = true
  try {
    const response = await deleteKomponenByKelas(kelasId, komponen.id)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Failed to delete komponen')
    }

    useToast().add({
      title: 'Success',
      description: 'Komponen penilaian berhasil dihapus',
      color: 'success'
    })

    await fetchAllData()
  } catch (error) {
    console.error('Failed to delete komponen:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal menghapus komponen penilaian',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Row edit mode handlers
function startRowEdit(userId: string, rowData: any) {
  const nilaiMap = new Map<string, number>()

  // Populate nilai map from current row data
  rowData.nilaiList.forEach((nilai: any) => {
    nilaiMap.set(nilai.komponenId, nilai.nilai)
  })

  editingRowId.value = userId
  editingRowValues.value = {
    nilaiMap,
    catatan: rowData.remark?.catatan || '',
    userId,
    remarkId: rowData.remark?.id
  }
}

function cancelRowEdit() {
  editingRowId.value = null
  editingRowValues.value = null
}

async function handleSaveRowEdit(userId: string) {
  if (!editingRowValues.value) return

  loading.value = true
  try {
    // Save all nilai changes
    for (const [komponenId, nilai] of editingRowValues.value.nilaiMap.entries()) {
      const nilaiEntry = pelajarListWithNilai.value
        .find(row => row.user.id === userId)
        ?.nilaiList.find(n => n.komponenId === komponenId)

      if (nilaiEntry) {
        // Update existing nilai
        const updateData: UpdateNilaiRequest = { nilai }
        const response = await updateNilai(nilaiEntry.id, updateData)
        if (response.status !== 200 && response.status !== 201) {
          throw new Error(`Failed to update nilai for komponen ${komponenId}`)
        }
      } else {
        // Entry new nilai
        const entryData: EntryNilaiRequest = {
          komponenId,
          pelajarId: userId,
          nilai
        }
        const response = await entryNilai(entryData)
        if (response.status !== 200 && response.status !== 201) {
          throw new Error(`Failed to entry nilai for komponen ${komponenId}`)
        }
      }
    }

    // Save catatan akademik if changed
    const currentRemark = pelajarListWithNilai.value
      .find(row => row.user.id === userId)
      ?.remark

    if (editingRowValues.value.catatan && editingRowValues.value.catatan.trim()) {
      if (currentRemark && editingRowValues.value.remarkId) {
        // Update existing remark
        const updateData: UpdateAcademicRemarkRequest = {
          catatan: editingRowValues.value.catatan
        }
        const response = await updateAcademicRemark(editingRowValues.value.remarkId, updateData)
        if (response.status !== 200 && response.status !== 201) {
          throw new Error('Failed to update catatan akademik')
        }
      } else if (!currentRemark) {
        // Create new remark
        const createData: CreateAcademicRemarkRequest = {
          userId,
          kelasId,
          semesterId: kelasData.value?.semesterId || '',
          catatan: editingRowValues.value.catatan
        }
        const response = await createAcademicRemark(createData)
        if (response.status !== 200 && response.status !== 201) {
          throw new Error('Failed to create catatan akademik')
        }
      }
    }

    useToast().add({
      title: 'Success',
      description: 'Data siswa berhasil diperbarui',
      color: 'success'
    })

    cancelRowEdit()
    await fetchAllData()
  } catch (error) {
    console.error('Failed to save row edit:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal menyimpan perubahan data siswa',
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

function openEditKomponenModal(komponen: NilaiKomponen) {
  editKomponenForm.komponenId = komponen.id
  editKomponenForm.nama = komponen.nama
  editKomponenForm.bobot = komponen.bobot
  isEditKomponenModalOpen.value = true
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

      <UButton label="Tambah Komponen Penilaian" size="lg" icon="i-lucide-plus" @click="openCreateKomponenModal" />
    </div>

    <!-- Komponen Info -->
    <div v-if="nilaiData?.length" class="flex gap-2 flex-wrap">
      <div v-for="komponen in nilaiData" :key="komponen.id"
        class="px-3 py-2 bg-elevated rounded-lg border border-default">
        <div class="flex flex-col items-start gap-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clipboard-list" class="size-4 text-primary" />
            <span class="font-medium text-sm">{{ komponen.nama }}</span>
            <span class="text-xs text-muted">{{ komponen.bobot }}%</span>
          </div>
          <div class="flex items-center gap-1">
            <UButton label="Edit" icon="i-lucide-pencil" size="sm" color="secondary" variant="outline" square
              @click="openEditKomponenModal(komponen)" />
            <UButton label="Hapus" icon="i-lucide-trash-2" size="sm" color="error" variant="outline" square
              @click="handleDeleteKomponen(komponen)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State for Komponen -->
    <div v-else-if="!loading && (!nilaiData || nilaiData.length === 0)"
      class="text-center py-8 border border-dashed border-default rounded-lg">
      <UIcon name="i-lucide-clipboard-list" class="size-12 mx-auto text-muted mb-3" />
      <p class="text-muted mb-4">Belum ada komponen penilaian</p>
      <UButton label="Tambah Komponen Penilaian" icon="i-lucide-plus" size="lg" @click="openCreateKomponenModal" />
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

          <UForm :schema="komponenSchema" :state="createKomponenForm" @submit="handleCreateKomponen"
            @keydown.ctrl.enter="handleCreateKomponen" @keydown.meta.enter="handleCreateKomponen" class="space-y-4">
            <UFormField label="Nama Komponen" name="nama" required>
              <UInput v-model="createKomponenForm.nama" placeholder="Contoh: UTS, UAS, Kuis 1" class="w-full"
                @keydown.enter="handleCreateKomponen" />
            </UFormField>

            <UFormField label="Bobot (%)" name="bobot" required>
              <UInput v-model.number="createKomponenForm.bobot" type="number" placeholder="Contoh: 30" min="0" max="100"
                class="w-full" @keydown.enter="handleCreateKomponen" />
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

    <!-- Edit Komponen Modal -->
    <UModal v-model:open="isEditKomponenModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Edit Komponen Penilaian</h3>
          </template>

          <UForm :schema="editKomponenSchema" :state="editKomponenForm" @submit="handleEditKomponen"
            @keydown.ctrl.enter="handleEditKomponen" @keydown.meta.enter="handleEditKomponen" class="space-y-4">
            <UFormField label="Nama Komponen" name="nama" required>
              <UInput v-model="editKomponenForm.nama" placeholder="Contoh: UTS, UAS, Kuis 1" class="w-full"
                @keydown.enter="handleEditKomponen" />
            </UFormField>

            <UFormField label="Bobot (%)" name="bobot" required>
              <UInput v-model.number="editKomponenForm.bobot" type="number" placeholder="Contoh: 30" min="0" max="100"
                class="w-full" @keydown.enter="handleEditKomponen" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" type="submit" :loading="loading">
                Simpan Perubahan
              </UButton>
              <UButton class="w-full justify-center" color="neutral" variant="outline"
                @click="isEditKomponenModalOpen = false">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
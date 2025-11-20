<template>
  <div class="space-y-6">
    <!-- Greetings/Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Atur Semester</h1>
    </div>

    <!-- Tambah/Edit Semester Modal -->
    <UModal v-model:open="isModalOpen">
      <UButton label="Tambah Semester" icon="i-lucide-calendar-cog" />

      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">{{ isEditing ? 'Edit' : 'Tambah' }} Semester</h3>
          </template>

          <UForm :state="form" @submit="onSubmit" class="space-y-4">
            <UFormField label="Nama Semester" name="nama" required>
              <UInput class="w-full" v-model="form.nama" placeholder="Ganjil 2025/2026" />
            </UFormField>

            <UFormField label="Tanggal Mulai" name="tanggalMulai" required>
              <UInput class="w-full" v-model="form.tanggalMulai" type="date" />
            </UFormField>

            <UFormField label="Tanggal Akhir" name="tanggalAkhir" required>
              <UInput class="w-full" v-model="form.tanggalAkhir" type="date" />
            </UFormField>

            <UFormField label="Status" name="status" required>
              <USelect class="w-full" v-model="form.status" :items="statusOptions" placeholder="Pilih Status" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3">
              <UButton class="w-full justify-center" type="submit" :loading="isSubmitting">
                {{ isEditing ? 'Update' : 'Tambah' }}
              </UButton>
              <UButton class="w-full justify-center" color="error" variant="outline" @click="closeModal">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <!-- Tableview -->
    <div class="flex flex-col flex-1 w-full border border-accented rounded-lg overflow-hidden">
      <!-- Filter & Actions Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-accented">
        <UInput v-model="namaFilter" class="max-w-sm min-w-[12ch]" placeholder="Filter by name..."
          icon="i-lucide-search">
          <template #trailing>
            <UButton v-show="namaFilter !== ''" color="neutral" variant="link" icon="i-lucide-x" :padded="false"
              @click="namaFilter = ''" />
          </template>
        </UInput>
      </div>

      <!-- Table -->
      <UTable ref="table" :data="semesters" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted]">
        {{ filteredSemestersCount }} semester(s) found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Semester } from '~/composables/useSemesterApi'

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false,
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { getAllSemesters, createSemester, updateSemester, deleteSemester } = useSemesterApi()

// State
const semesters = ref<Semester[]>([])
const isLoading = ref(false)
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const namaFilter = ref('')
const table = useTemplateRef('table')

const form = ref({
  id: '',
  nama: '',
  tanggalMulai: '',
  tanggalAkhir: '',
  status: 'AKTIF' as 'AKTIF' | 'MENDATANG' | 'SELESAI'
})

const statusOptions = [
  { label: 'Aktif', value: 'AKTIF' },
  { label: 'Mendatang', value: 'MENDATANG' },
  { label: 'Selesai', value: 'SELESAI' }
]

// Computed
const filteredSemestersCount = computed(() => {
  if (!namaFilter.value) return semesters.value.length
  return semesters.value.filter(semester =>
    semester.nama.toLowerCase().includes(namaFilter.value.toLowerCase())
  ).length
})

// Table Columns
const columns: TableColumn<Semester>[] = [
  {
    accessorKey: 'nama',
    header: 'Nama Semester',
    cell: ({ row }) => {
      return h('p', { class: 'font-medium text-[--ui-text-highlighted]' }, row.getValue('nama'))
    }
  },
  {
    accessorKey: 'tanggalMulai',
    header: 'Tanggal Mulai',
    cell: ({ row }) => {
      return new Date(row.getValue('tanggalMulai')).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  },
  {
    accessorKey: 'tanggalAkhir',
    header: 'Tanggal Akhir',
    cell: ({ row }) => {
      return new Date(row.getValue('tanggalAkhir')).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = {
        AKTIF: 'success' as const,
        MENDATANG: 'warning' as const,
        SELESAI: 'neutral' as const
      }[status] || 'neutral' as const

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color
      }, () => status.toLowerCase())
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const items = [
        {
          type: 'label' as const,
          label: 'Actions'
        },
        {
          label: 'Edit Semester',
          icon: 'i-lucide-edit',
          onSelect: () => handleEdit(row.original)
        },
        {
          type: 'separator' as const
        },
        {
          label: 'Delete Semester',
          icon: 'i-lucide-trash',
          color: 'error' as const,
          onSelect: () => handleDelete(row.original)
        }
      ]

      return h('div', { class: 'text-right' }, h(UDropdownMenu, {
        'content': {
          align: 'end'
        },
        items,
        'aria-label': 'Actions dropdown'
      }, () => h(UButton, {
        'icon': 'i-lucide-ellipsis-vertical',
        'color': 'neutral',
        'variant': 'ghost',
        'class': 'ml-auto',
        'aria-label': 'Actions dropdown'
      })))
    }
  }
]

// Methods
async function fetchSemesters() {
  isLoading.value = true
  try {
    const response = await getAllSemesters()
    semesters.value = response
  } catch (error: any) {
    console.error('[SEMESTERS] Error:', error)
    toast.add({
      title: 'Error loading semesters',
      description: error.message || 'Failed to fetch semesters',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

function closeModal() {
  isModalOpen.value = false
  isEditing.value = false
  form.value = {
    id: '',
    nama: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    status: 'AKTIF'
  }
}

async function onSubmit() {
  isSubmitting.value = true
  try {
    const payload = {
      nama: form.value.nama,
      tanggalMulai: form.value.tanggalMulai,
      tanggalAkhir: form.value.tanggalAkhir,
      status: form.value.status
    }

    if (isEditing.value) {
      await updateSemester(form.value.id, payload)
    } else {
      await createSemester(payload)
    }

    toast.add({
      title: `Semester ${isEditing.value ? 'updated' : 'created'} successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    closeModal()
    await fetchSemesters()
  } catch (error: any) {
    toast.add({
      title: `Error ${isEditing.value ? 'updating' : 'creating'} semester`,
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleEdit(semester: Semester) {
  isEditing.value = true
  form.value = {
    id: semester.id,
    nama: semester.nama,
    tanggalMulai: new Date(semester.tanggalMulai).toISOString().split('T')[0] || '',
    tanggalAkhir: new Date(semester.tanggalAkhir).toISOString().split('T')[0] || '',
    status: semester.status as 'AKTIF' | 'MENDATANG' | 'SELESAI'
  }
  isModalOpen.value = true
}

async function handleDelete(semester: Semester) {
  const confirmed = confirm(`Yakin ingin menghapus semester ${semester.nama}?`)
  if (!confirmed) return

  try {
    await deleteSemester(semester.id)

    toast.add({
      title: 'Semester deleted successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await fetchSemesters()
  } catch (error: any) {
    toast.add({
      title: 'Error deleting semester',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Watch nama filter and update table
watch(namaFilter, (value) => {
  table.value?.tableApi?.getColumn('nama')?.setFilterValue(value)
})

// Load semesters on mount
onMounted(() => {
  fetchSemesters()
})
</script>
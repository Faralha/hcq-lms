<template>
  <div class="space-y-6">
    <!-- Greetings/Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Atur Program</h1>
    </div>

    <!-- Tambah Mata Pelajaran Modal -->
    <UModal v-model:open="isModalOpen">
      <UButton label="Tambah Program" icon="i-lucide-book-plus" @click="openCreateModal" />

      <template #content>
        <UCard>
          <h3 class="text-lg font-semibold mb-4">{{ isEditing ? 'Edit' : 'Tambah' }} Program</h3>

          <UForm :schema="schema" :state="form" @submit="onSubmit" class="space-y-4 w-full">
            <UFormField label="Nama Program" name="nama" required>
              <UInput class="inputStyle" v-model="form.nama" placeholder="Tahfidz Qur'an" />
            </UFormField>

            <UFormField label="Kode" name="kode" required>
              <UInput class="inputStyle" v-model="form.kode" placeholder="TQA" />
            </UFormField>

            <UFormField label="Deskripsi" name="deskripsi">
              <UTextarea class="inputStyle" v-model="form.deskripsi" placeholder="Pembelajaran menghafal Al-Qur'an..."
                :rows="3" />
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
      <UTable ref="table" :data="mataPelajaran" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted]">
        {{ filteredCount }} program ditemukan
      </div>
    </div>
  </div>
</template>

<style scoped>
.inputStyle {
  width: 100%;
}
</style>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import * as z from 'zod'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false,
})

interface MataPelajaran {
  id: string
  nama: string
  kode: string
  deskripsi?: string
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { getAllMataPelajaran, createMataPelajaran, updateMataPelajaran, deleteMataPelajaran } = useMataPelajaranApi()

// State
const mataPelajaran = ref<MataPelajaran[]>([])
const isLoading = ref(false)
const namaFilter = ref('')
const table = useTemplateRef('table')
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

const schema = z.object({
  id: z.string().optional(),
  nama: z.string().min(1, 'Nama program wajib diisi'),
  kode: z.string().min(1, 'Kode wajib diisi'),
  deskripsi: z.string().optional()
})

type MataPelajaranSchema = z.output<typeof schema>

const form = reactive<Partial<MataPelajaranSchema>>({
  id: '',
  nama: '',
  kode: '',
  deskripsi: ''
})

// Computed
const filteredCount = computed(() => {
  if (!namaFilter.value) return mataPelajaran.value.length
  return mataPelajaran.value.filter(mp =>
    mp.nama.toLowerCase().includes(namaFilter.value.toLowerCase()) ||
    mp.kode.toLowerCase().includes(namaFilter.value.toLowerCase())
  ).length
})

// Table Columns
const columns: TableColumn<MataPelajaran>[] = [
  {
    accessorKey: 'kode',
    header: 'Kode',
    cell: ({ row }) => {
      return h('span', { class: 'font-mono font-semibold text-[--ui-text-highlighted]' }, row.getValue('kode'))
    }
  },
  {
    accessorKey: 'nama',
    header: 'Nama Program',
    cell: ({ row }) => {
      return h('p', { class: 'font-medium' }, row.getValue('nama'))
    }
  },
  {
    accessorKey: 'deskripsi',
    header: 'Deskripsi',
    cell: ({ row }) => {
      const deskripsi = row.getValue('deskripsi') as string
      return h('p', { class: 'text-[--ui-text-muted] text-sm truncate max-w-md' }, deskripsi || '-')
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
          label: 'Edit Program',
          icon: 'i-lucide-edit',
          onSelect: () => handleEdit(row.original)
        },
        {
          type: 'separator' as const
        },
        {
          label: 'Delete Program',
          icon: 'i-lucide-trash',
          color: 'error' as const,
          onSelect: () => handleDelete(row.original)
        }
      ]

      return h('div', { class: 'text-right' }, h(UDropdownMenu, {
        'content': { align: 'end' },
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
async function fetchMataPelajaran() {
  isLoading.value = true
  try {
    const response = await getAllMataPelajaran()
    if (response.status === 200 && response.data) {
      mataPelajaran.value = response.data
    }
  } catch (error: any) {
    console.error('[MATA PELAJARAN] Error:', error)
    toast.add({
      title: 'Error loading program',
      description: error.message || 'Failed to fetch program',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  form.id = ''
  form.nama = ''
  form.kode = ''
  form.deskripsi = ''
  isModalOpen.value = true
}

function handleEdit(mp: MataPelajaran) {
  isEditing.value = true
  form.id = mp.id
  form.nama = mp.nama
  form.kode = mp.kode
  form.deskripsi = mp.deskripsi || ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  form.id = ''
  form.nama = ''
  form.kode = ''
  form.deskripsi = ''
}

async function onSubmit() {
  isSubmitting.value = true
  try {
    const payload = {
      nama: form.nama || '',
      kode: form.kode || '',
      deskripsi: form.deskripsi || undefined
    }

    let response
    if (isEditing.value) {
      response = await updateMataPelajaran(form.id || '', payload)
    } else {
      response = await createMataPelajaran(payload)
    }

    if (response.status !== 200 && response.status !== 201) throw new Error('Failed to save program')

    toast.add({
      title: `Program ${isEditing.value ? 'updated' : 'created'} successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    closeModal()
    await fetchMataPelajaran()
  } catch (error: any) {
    toast.add({
      title: `Error ${isEditing.value ? 'updating' : 'creating'} program`,
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(mp: MataPelajaran) {
  const confirmed = confirm(`Yakin ingin menghapus program ${mp.nama}?`)
  if (!confirmed) return

  try {
    const response = await deleteMataPelajaran(mp.id)
    if (response.status !== 200) throw new Error('Failed to delete program')

    toast.add({
      title: 'Program deleted successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    mataPelajaran.value = mataPelajaran.value.filter(m => m.id !== mp.id)
  } catch (error: any) {
    toast.add({
      title: 'Error deleting program',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Watch nama filter
watch(namaFilter, (value) => {
  table.value?.tableApi?.getColumn('nama')?.setFilterValue(value)
})

// Load data on mount
onMounted(() => {
  fetchMataPelajaran()
})
</script>

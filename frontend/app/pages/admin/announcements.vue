<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest
} from '~/composables/useAnnouncementApi'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default'
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// API Composables
const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = useAnnouncementApi()
const { getAllKelas } = useKelasApi()

// State
const announcements = ref<Announcement[]>([])
const kelasList = ref<any[]>([])
const loading = ref(false)
const totalItems = ref(0)

// Pagination
const page = ref(1)
const limit = ref(10)
const totalPages = ref(0)
const hasNextPage = ref(false)
const hasPreviousPage = ref(false)

// Search
const searchTerm = ref('')
let searchTimeout: number | null = null

// Debounced search function
const debouncedFetchAnnouncements = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = window.setTimeout(() => {
    page.value = 1 // Reset to first page on search
    fetchAnnouncements()
  }, 500)
}

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

// Form data
const createForm = ref<CreateAnnouncementRequest>({
  judul: '',
  isi: '',
  scope: 'GLOBAL',
  kelasId: undefined
})

const editForm = ref<UpdateAnnouncementRequest & { id: string }>({
  id: '',
  judul: '',
  isi: ''
})

const deleteId = ref('')

// Table columns
const columns: TableColumn<Announcement>[] = [
  {
    accessorKey: 'judul',
    header: 'Judul',
    cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.getValue('judul'))
  },
  {
    accessorKey: 'isi',
    header: 'Isi',
    cell: ({ row }) => {
      const text = row.getValue('isi') as string
      const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text
      return h('div', { class: 'text-muted' }, truncated)
    }
  },
  {
    accessorKey: 'scope',
    header: 'Scope',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as string
      const color = scope === 'GLOBAL' ? 'primary' : 'info'
      return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => scope.toLowerCase())
    }
  },
  {
    accessorKey: 'kelas',
    header: 'Kelas',
    cell: ({ row }) => {
      const kelas = row.original.kelas
      if (!kelas) return h('div', { class: 'text-muted' }, '-')
      return h('div', { class: 'text-highlighted' }, kelas.namaKelas)
    }
  },
  {
    accessorKey: 'creator',
    header: 'Dibuat Oleh',
    cell: ({ row }) => {
      const creator = row.original.creator
      if (!creator) return h('div', { class: 'text-muted' }, '-')
      return h('div', { class: 'text-highlighted' }, creator.nama)
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return h('div', { class: 'text-muted' }, date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const items = [
        {
          label: 'Edit',
          icon: 'i-lucide-edit',
          click: () => openEditModal(row.original)
        },
        {
          label: 'Delete',
          icon: 'i-lucide-trash',
          click: () => openDeleteModal(row.original.id),
          class: 'text-error'
        }
      ]

      return h('div', { class: 'flex justify-end' },
        h(UDropdownMenu, { items }, () =>
          h(UButton, {
            icon: 'i-lucide-more-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'sm'
          })
        )
      )
    }
  }
]

// Fetch data
async function fetchAnnouncements() {
  loading.value = true
  try {
    const response = await getAllAnnouncements({
      page: page.value,
      limit: limit.value,
      search: searchTerm.value || undefined
    })

    if (response.status === 200 && response.data) {
      announcements.value = response.data.data
      totalItems.value = response.data.meta.total
      totalPages.value = response.data.meta.totalPages
      hasNextPage.value = response.data.meta.hasNextPage
      hasPreviousPage.value = response.data.meta.hasPreviousPage
    }
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memuat data announcement',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Fetch kelas list for dropdown
async function fetchKelasList() {
  try {
    const response = await getAllKelas()
    if (response.status === 200 && response.data) {
      kelasList.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch kelas:', error)
  }
}

// Create announcement
async function handleCreate() {
  loading.value = true
  try {
    const response = await createAnnouncement(createForm.value)
    if (response.status !== 201 && response.status !== 200) throw new Error('Failed to create announcement')

    useToast().add({
      title: 'Success',
      description: 'Announcement berhasil dibuat',
      color: 'success'
    })

    isCreateModalOpen.value = false
    resetCreateForm()
    await fetchAnnouncements()
  } catch (error) {
    console.error('Failed to create announcement:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal membuat announcement',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Update announcement
async function handleUpdate() {
  loading.value = true
  try {
    const { id, ...data } = editForm.value
    const response = await updateAnnouncement(id, data)
    if (response.status !== 200) throw new Error('Failed to update announcement')

    useToast().add({
      title: 'Success',
      description: 'Announcement berhasil diupdate',
      color: 'success'
    })

    isEditModalOpen.value = false
    await fetchAnnouncements()
  } catch (error) {
    console.error('Failed to update announcement:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal mengupdate announcement',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Delete announcement
async function handleDelete() {
  loading.value = true
  try {
    const response = await deleteAnnouncement(deleteId.value)
    if (response.status !== 200) throw new Error('Failed to delete announcement')

    useToast().add({
      title: 'Success',
      description: 'Announcement berhasil dihapus',
      color: 'success'
    })

    isDeleteModalOpen.value = false
    deleteId.value = ''
    await fetchAnnouncements()
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal menghapus announcement',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Modal handlers
function openCreateModal() {
  resetCreateForm()
  isCreateModalOpen.value = true
}

function openEditModal(announcement: Announcement) {
  editForm.value = {
    id: announcement.id,
    judul: announcement.judul,
    isi: announcement.isi
  }
  isEditModalOpen.value = true
}

function openDeleteModal(id: string) {
  deleteId.value = id
  isDeleteModalOpen.value = true
}

function resetCreateForm() {
  createForm.value = {
    judul: '',
    isi: '',
    scope: 'GLOBAL',
    kelasId: undefined
  }
}

// Scope options
const scopeOptions = [
  { label: 'Global', value: 'GLOBAL' },
  { label: 'Kelas', value: 'KELAS' }
]

// Computed kelas options
const kelasOptions = computed(() => {
  return kelasList.value.map(k => ({
    label: k.namaKelas,
    value: k.id
  }))
})

// Watch for scope changes to clear kelasId
watch(() => createForm.value.scope, (newScope) => {
  if (newScope === 'GLOBAL') {
    createForm.value.kelasId = undefined
  }
})

// Watch for search changes
watch(searchTerm, () => {
  debouncedFetchAnnouncements()
})

// Watch for page changes
watch(page, () => {
  fetchAnnouncements()
})

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchAnnouncements(),
    fetchKelasList()
  ])
})
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-highlighted">
          Announcement Management
        </h1>
        <p class="text-muted mt-1">
          Kelola announcement untuk sistem
        </p>
      </div>

      <UButton label="Buat Announcement" icon="i-lucide-plus" @click="openCreateModal" />
    </div>

    <!-- Search & Stats -->
    <div class="flex items-center justify-between gap-4">
      <UInput v-model="searchTerm" icon="i-lucide-search" placeholder="Cari announcement..." class="w-full max-w-sm" />

      <div class="text-sm text-muted">
        Total: {{ totalItems }} announcement
      </div>
    </div>

    <!-- Table -->
    <UTable :data="announcements" :columns="columns" :loading="loading" class="w-full">
      <template #empty>
        <div class="text-center py-8">
          <p class="text-muted">Tidak ada announcement</p>
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div class="flex justify-between items-center">
      <div class="text-sm text-muted">
        Halaman {{ page }} dari {{ totalPages }}
      </div>

      <div class="flex gap-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="outline" :disabled="!hasPreviousPage || loading"
          @click="page--" />

        <UButton icon="i-lucide-chevron-right" color="neutral" variant="outline" :disabled="!hasNextPage || loading"
          @click="page++" />
      </div>
    </div>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen" title="Buat Announcement" :ui="{ footer: 'flex justify-end gap-2' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Judul" required>
            <UInput v-model="createForm.judul" placeholder="Masukkan judul" />
          </UFormField>

          <UFormField label="Isi" required>
            <UTextarea v-model="createForm.isi" placeholder="Masukkan isi announcement" :rows="5" />
          </UFormField>

          <UFormField label="Scope" required>
            <USelectMenu :model-value="scopeOptions.find(opt => opt.value === createForm.scope)" :items="scopeOptions"
              value-attribute="value" option-attribute="label"
              @update:model-value="(val: any) => createForm.scope = val.value" />
          </UFormField>

          <UFormField v-if="createForm.scope === 'KELAS'" label="Kelas" required>
            <USelectMenu :model-value="kelasOptions.find(opt => opt.value === createForm.kelasId)" :items="kelasOptions"
              value-attribute="value" option-attribute="label" placeholder="Pilih kelas"
              @update:model-value="(val: any) => createForm.kelasId = val?.value" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton label="Batal" color="neutral" variant="outline" @click="isCreateModalOpen = false" />
        <UButton label="Simpan" :loading="loading"
          :disabled="!createForm.judul || !createForm.isi || (createForm.scope === 'KELAS' && !createForm.kelasId)"
          @click="handleCreate" />
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditModalOpen" title="Edit Announcement" :ui="{ footer: 'flex justify-end gap-2' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Judul" required>
            <UInput v-model="editForm.judul" placeholder="Masukkan judul" />
          </UFormField>

          <UFormField label="Isi" required>
            <UTextarea v-model="editForm.isi" placeholder="Masukkan isi announcement" :rows="5" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton label="Batal" color="neutral" variant="outline" @click="isEditModalOpen = false" />
        <UButton label="Update" :loading="loading" :disabled="!editForm.judul || !editForm.isi" @click="handleUpdate" />
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Hapus Announcement" :ui="{ footer: 'flex justify-end gap-2' }">
      <template #body>
        <p class="text-muted">
          Apakah Anda yakin ingin menghapus announcement ini? Tindakan ini tidak dapat dibatalkan.
        </p>
      </template>

      <template #footer>
        <UButton label="Batal" color="neutral" variant="outline" @click="isDeleteModalOpen = false" />
        <UButton label="Hapus" color="error" :loading="loading" @click="handleDelete" />
      </template>
    </UModal>
  </div>
</template>

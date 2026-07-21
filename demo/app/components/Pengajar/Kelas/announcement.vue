<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Announcements</h2>

    <!-- Table -->
    <UTable ref="announcementsTable" v-model:pagination="announcementsPagination" :data="classAnnouncements"
      :columns="announcementColumns" :loading="isLoadingAnnouncements"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="border border-accented rounded-lg overflow-x-auto">
      <template #empty>
        <div class="text-center py-12">
          <UIcon name="i-lucide-megaphone" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
          <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada announcement</p>
          <p class="text-sm text-[--ui-text-muted]">Tambahkan announcement untuk kelas ini</p>
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div v-if="classAnnouncements.length > 0" class="flex justify-end">
      <UPagination :page="(announcementsTable?.tableApi?.getState().pagination.pageIndex || 0) + 1"
        :items-per-page="announcementsTable?.tableApi?.getState().pagination.pageSize || 3"
        :total="announcementsTable?.tableApi?.getFilteredRowModel().rows.length || 0"
        @update:page="(p) => announcementsTable?.tableApi?.setPageIndex(p - 1)" />
    </div>

    <!-- Modal Create Announcement -->
    <UModal v-model:open="isCreateAnnouncementModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Tambah Announcement</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Judul" required class="w-full">
              <UInput v-model="newAnnouncement.judul" placeholder="Masukkan judul announcement" class="w-full" />
            </UFormField>

            <UFormField label="Isi" required class="w-full">
              <UTextarea v-model="newAnnouncement.isi" placeholder="Masukkan isi announcement" :rows="5"
                class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Simpan" icon="i-lucide-save"
                :loading="isCreatingAnnouncement" :disabled="!newAnnouncement.judul || !newAnnouncement.isi"
                @click="handleCreateAnnouncement" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isCreateAnnouncementModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Modal Edit Announcement -->
    <UModal v-model:open="isEditAnnouncementModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Edit Announcement</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Judul" required class="w-full">
              <UInput v-model="editAnnouncement.judul" placeholder="Masukkan judul announcement" class="w-full" />
            </UFormField>

            <UFormField label="Isi" required class="w-full">
              <UTextarea v-model="editAnnouncement.isi" placeholder="Masukkan isi announcement" :rows="5"
                class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Update" icon="i-lucide-save"
                :loading="isUpdatingAnnouncement" :disabled="!editAnnouncement.judul || !editAnnouncement.isi"
                @click="handleUpdateAnnouncement" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isEditAnnouncementModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Modal Delete Announcement -->
    <UModal v-model:open="isDeleteAnnouncementModalOpen" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Hapus Announcement</h3>
          </template>

          <div class="space-y-4">
            <p class="text-muted">
              Apakah Anda yakin ingin menghapus announcement ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div class="w-full flex flex-col items-center gap-3 pt-2">
              <UButton class="w-full justify-center" label="Hapus" color="error" :loading="isDeletingAnnouncement"
                @click="handleDeleteAnnouncement" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isDeleteAnnouncementModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useAuthStore } from '~/stores/auth'
import type { TableColumn } from '@nuxt/ui'
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '~/composables/useAnnouncementApi'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  kelasId: string
}>()

const toast = useToast()
const authStore = useAuthStore()

// Composables
const { createAnnouncement, getAllAnnouncements, updateAnnouncement, deleteAnnouncement } = useAnnouncementApi()

// State
const classAnnouncements = ref<Announcement[]>([])
const isLoadingAnnouncements = ref(false)
const isCreateAnnouncementModalOpen = ref(false)
const isEditAnnouncementModalOpen = ref(false)
const isDeleteAnnouncementModalOpen = ref(false)
const isCreatingAnnouncement = ref(false)
const isUpdatingAnnouncement = ref(false)
const isDeletingAnnouncement = ref(false)
const newAnnouncement = ref<CreateAnnouncementRequest>({
  judul: '',
  isi: '',
  scope: 'KELAS',
  kelasId: ''
})
const editAnnouncement = ref<UpdateAnnouncementRequest & { id: string }>({
  id: '',
  judul: '',
  isi: ''
})
const deleteAnnouncementId = ref('')

const announcementsPagination = ref({
  pageIndex: 0,
  pageSize: 3
})
const announcementsTable = useTemplateRef('announcementsTable')

// Helper function to format error messages
function formatErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  // If error.message is an array, join it
  if (Array.isArray(error.message)) {
    return error.message.join(', ')
  }
  // If error has response.data.message
  if (error.response?.data?.message) {
    if (Array.isArray(error.response.data.message)) {
      return error.response.data.message.join(', ')
    }
    return error.response.data.message
  }
  // Return error.message or fallback
  return error.message || fallback
}

// Announcement table columns
const announcementColumns: TableColumn<Announcement>[] = [
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
      // Only show edit/delete if current user is the creator
      // Check both creatorId and creator.id for compatibility
      const creatorId = row.original.creatorId || row.original.creator?.id
      const isCreator = authStore.user?.id === creatorId

      if (!isCreator) {
        return h('div', { class: 'flex justify-end' }, '-')
      }

      const items = [
        {
          label: 'Edit',
          icon: 'i-lucide-edit',
          onSelect: () => openEditAnnouncementModal(row.original)
        },
        {
          label: 'Delete',
          icon: 'i-lucide-trash',
          onSelect: () => openDeleteAnnouncementModal(row.original.id),
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

// Functions
async function fetchClassAnnouncements() {
  isLoadingAnnouncements.value = true
  try {
    console.log('[ANNOUNCEMENTS] Fetching announcements for kelas:', props.kelasId)
    const response = await getAllAnnouncements()

    console.log('[ANNOUNCEMENTS] Response:', response)

    if (response.status === 200 && response.data) {
      classAnnouncements.value = response.data
    }
  } catch (error: any) {
    console.error('[ANNOUNCEMENTS] Error:', error)
    toast.add({
      title: 'Error loading announcements',
      description: formatErrorMessage(error, 'Failed to fetch announcements'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoadingAnnouncements.value = false
  }
}

function openCreateAnnouncementModal() {
  newAnnouncement.value = {
    judul: '',
    isi: '',
    scope: 'KELAS',
    kelasId: props.kelasId
  }
  isCreateAnnouncementModalOpen.value = true
}

async function handleCreateAnnouncement() {
  if (!newAnnouncement.value.judul.trim() || !newAnnouncement.value.isi.trim()) {
    toast.add({
      title: 'Validasi error',
      description: 'Judul dan isi announcement harus diisi',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isCreatingAnnouncement.value = true
  try {
    newAnnouncement.value.kelasId = props.kelasId
    const response = await createAnnouncement(newAnnouncement.value)

    console.log('[CREATE ANNOUNCEMENT] Response:', response)

    if (response.status === 200 || response.status === 201) {
      toast.add({
        title: 'Announcement berhasil dibuat',
        description: 'Announcement telah ditambahkan ke kelas ini',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isCreateAnnouncementModalOpen.value = false
      await fetchClassAnnouncements()
    } else {
      throw new Error('Failed to create announcement')
    }
  } catch (error: any) {
    console.error('[CREATE ANNOUNCEMENT] Error:', error)
    toast.add({
      title: 'Error membuat announcement',
      description: formatErrorMessage(error, 'Failed to create announcement'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isCreatingAnnouncement.value = false
  }
}

function openEditAnnouncementModal(announcement: Announcement) {
  editAnnouncement.value = {
    id: announcement.id,
    judul: announcement.judul,
    isi: announcement.isi
  }
  isEditAnnouncementModalOpen.value = true
}

async function handleUpdateAnnouncement() {
  if (!editAnnouncement.value.judul?.trim() || !editAnnouncement.value.isi?.trim()) {
    toast.add({
      title: 'Validasi error',
      description: 'Judul dan isi announcement harus diisi',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isUpdatingAnnouncement.value = true
  try {
    const { id, ...data } = editAnnouncement.value
    const response = await updateAnnouncement(id, data)

    console.log('[UPDATE ANNOUNCEMENT] Response:', response)

    if (response.status === 200) {
      toast.add({
        title: 'Announcement berhasil diupdate',
        description: 'Perubahan telah disimpan',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isEditAnnouncementModalOpen.value = false
      await fetchClassAnnouncements()
    } else {
      throw new Error('Failed to update announcement')
    }
  } catch (error: any) {
    console.error('[UPDATE ANNOUNCEMENT] Error:', error)
    toast.add({
      title: 'Error mengupdate announcement',
      description: formatErrorMessage(error, 'Failed to update announcement'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isUpdatingAnnouncement.value = false
  }
}

function openDeleteAnnouncementModal(id: string) {
  deleteAnnouncementId.value = id
  isDeleteAnnouncementModalOpen.value = true
}

async function handleDeleteAnnouncement() {
  isDeletingAnnouncement.value = true
  try {
    const response = await deleteAnnouncement(deleteAnnouncementId.value)

    console.log('[DELETE ANNOUNCEMENT] Response:', response)

    if (response.status === 200) {
      toast.add({
        title: 'Announcement berhasil dihapus',
        description: 'Announcement telah dihapus',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isDeleteAnnouncementModalOpen.value = false
      deleteAnnouncementId.value = ''
      await fetchClassAnnouncements()
    } else {
      throw new Error('Failed to delete announcement')
    }
  } catch (error: any) {
    console.error('[DELETE ANNOUNCEMENT] Error:', error)
    toast.add({
      title: 'Error menghapus announcement',
      description: formatErrorMessage(error, 'Failed to delete announcement'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isDeletingAnnouncement.value = false
  }
}

// Public method to refresh data (callable from parent)
function refresh() {
  fetchClassAnnouncements()
}

function openModal() {
  openCreateAnnouncementModal()
}

// Expose methods for parent component
defineExpose({
  refresh,
  openModal
})

// Watch kelasId and fetch data
watch(() => props.kelasId, async () => {
  if (props.kelasId) {
    await fetchClassAnnouncements()
  }
}, { immediate: true })
</script>

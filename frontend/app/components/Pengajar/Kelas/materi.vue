<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Materi Kelas</h2>
      <UButton label="Tambah Section" icon="i-lucide-plus" size="lg" @click="openCreateSectionModal" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingMateri" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="materiSections.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-book-open-text" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada materi</p>
      <p class="text-sm text-[--ui-text-muted]">Tambahkan section materi untuk kelas ini</p>
    </div>

    <!-- Materi Sections List -->
    <div v-else class="grid gap-4">
      <UCard v-for="section in materiSections" :key="section.id">
        <div class="space-y-4">
          <!-- Section Header -->
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{{ section.judul }}</h3>
              <p v-if="section.deskripsi" class="text-sm text-[--ui-text-muted] mt-1">{{ section.deskripsi }}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto">
              <UButton icon="i-lucide-edit" label="Edit" size="lg" color="secondary" variant="solid"
                @click="openEditSectionModal(section)" />
              <UButton icon="i-lucide-upload" label="Unggah Materi" size="lg" color="primary" variant="solid"
                @click="openUploadModal(section.id)" />
              <UButton icon="i-lucide-trash-2" label="Hapus" size="lg" color="error" variant="solid"
                @click="handleDeleteSection(section.id)" />
            </div>
          </div>

          <!-- Files List -->
          <div v-if="section.files && section.files.length > 0" class="space-y-2">
            <div v-for="file in section.files" :key="file.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UIcon :name="getFileIconByType(file.mimetype)" class="w-5 h-5 text-primary shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ file.judul }}</p>
                  <p class="text-xs text-[--ui-text-muted]">{{ formatFileSize(file.size) }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton icon="i-lucide-download" size="lg" color="primary" variant="outline"
                  @click="handleDownloadFile(file.id, file.filename)" />
                <UButton icon="i-lucide-trash-2" size="lg" color="error" variant="subtle"
                  @click="handleDeleteFile(file.id)" />
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-sm text-[--ui-text-muted]">
            Belum ada file
          </div>
        </div>
      </UCard>
    </div>

    <!-- Modal Create Section -->
    <UModal v-model:open="isCreateSectionModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Tambah Section Materi</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Judul Section" required class="w-full">
              <UInput v-model="newSection.judul" placeholder="Masukkan judul section" class="w-full" />
            </UFormField>

            <UFormField label="Deskripsi (Opsional)" class="w-full">
              <UTextarea v-model="newSection.deskripsi" placeholder="Masukkan deskripsi" :rows="3" class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Simpan" icon="i-lucide-save" :loading="isCreatingSection"
                @click="handleCreateSection" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isCreateSectionModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Modal Edit Section -->
    <UModal v-model:open="isEditSectionModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Edit Section Materi</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Judul Section" required class="w-full">
              <UInput v-model="editSection.judul" placeholder="Masukkan judul section" class="w-full" />
            </UFormField>

            <UFormField label="Deskripsi (Opsional)" class="w-full">
              <UTextarea v-model="editSection.deskripsi" placeholder="Masukkan deskripsi" :rows="3" class="w-full" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Update" icon="i-lucide-save" :loading="isUpdatingSection"
                @click="handleUpdateSection" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isEditSectionModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Modal Upload File -->
    <UModal v-model:open="isUploadModalOpen" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Upload File Materi</h3>
          </template>

          <div class="space-y-4">
            <UploadFile accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" :multiple="false" :max-size="50 * 1024 * 1024"
              :on-upload="handleUploadFile" @success="onUploadSuccess" @error="onUploadError" />

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Tutup" color="neutral" variant="outline"
                @click="isUploadModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { MateriSection } from '~/composables/useMateriApi'

// Props
const props = defineProps<{
  kelasId: string
}>()

const toast = useToast()

// Composables
const { createSection, getSectionsByKelas, updateSection, deleteSection, uploadFile, downloadFile, deleteFile } = useMateriApi()

// Materi state
const materiSections = ref<MateriSection[]>([])
const isLoadingMateri = ref(false)
const isCreateSectionModalOpen = ref(false)
const isEditSectionModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isCreatingSection = ref(false)
const isUpdatingSection = ref(false)
const currentSectionId = ref<string>('')
const newSection = ref({
  judul: '',
  deskripsi: ''
})
const editSection = ref({
  id: '',
  judul: '',
  deskripsi: ''
})

// Helper function to format error messages
function formatErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  if (Array.isArray(error.message)) {
    return error.message.join(', ')
  }
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.join(', ')
  }
  return error.message || error.data?.message || fallback
}

// Materi functions
async function fetchMateriSections() {
  isLoadingMateri.value = true
  try {
    console.log('[MATERI] Fetching sections for kelas:', props.kelasId)
    const response = await getSectionsByKelas(props.kelasId)

    console.log('[MATERI] Response:', response)

    // API returns array directly (like useKelasApi)
    if (response.status === 200 && response.data) {
      materiSections.value = response.data
    }
  } catch (error: any) {
    console.error('[MATERI] Error:', error)
    toast.add({
      title: 'Error loading materi',
      description: formatErrorMessage(error, 'Failed to fetch materi'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoadingMateri.value = false
  }
}

function openCreateSectionModal() {
  newSection.value = { judul: '', deskripsi: '' }
  isCreateSectionModalOpen.value = true
}

async function handleCreateSection() {
  if (!newSection.value.judul.trim()) {
    toast.add({
      title: 'Validasi error',
      description: 'Judul section harus diisi',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isCreatingSection.value = true
  try {
    const response = await createSection({
      kelasId: props.kelasId,
      judul: newSection.value.judul,
      deskripsi: newSection.value.deskripsi || ''
    })

    console.log('[CREATE SECTION] Response:', response)

    if (response.status === 200 || response.status === 201) {
      toast.add({
        title: 'Section berhasil dibuat',
        description: 'Section materi telah ditambahkan',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isCreateSectionModalOpen.value = false
      await fetchMateriSections()
    } else {
      throw new Error('Failed to create section')
    }
  } catch (error: any) {
    console.error('[CREATE SECTION] Error:', error)
    toast.add({
      title: 'Error membuat section',
      description: formatErrorMessage(error, 'Failed to create section'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isCreatingSection.value = false
  }
}

function openEditSectionModal(section: MateriSection) {
  editSection.value = {
    id: section.id,
    judul: section.judul,
    deskripsi: section.deskripsi || ''
  }
  isEditSectionModalOpen.value = true
}

async function handleUpdateSection() {
  if (!editSection.value.judul.trim()) {
    toast.add({
      title: 'Validasi error',
      description: 'Judul section harus diisi',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isUpdatingSection.value = true
  try {
    const response = await updateSection(editSection.value.id, {
      judul: editSection.value.judul,
      deskripsi: editSection.value.deskripsi || undefined
    })

    console.log('[UPDATE SECTION] Response:', response)

    if (response.status === 200 || response.status === 201) {
      toast.add({
        title: 'Section berhasil diupdate',
        description: 'Perubahan telah disimpan',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isEditSectionModalOpen.value = false
      await fetchMateriSections()
    } else {
      throw new Error('Failed to update section')
    }
  } catch (error: any) {
    console.error('[UPDATE SECTION] Error:', error)
    toast.add({
      title: 'Error mengupdate section',
      description: formatErrorMessage(error, 'Failed to update section'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isUpdatingSection.value = false
  }
}

function openUploadModal(sectionId: string) {
  currentSectionId.value = sectionId
  isUploadModalOpen.value = true
}

async function handleUploadFile(files: File[]) {
  if (files.length === 0 || !currentSectionId.value) return

  const file = files[0]
  if (!file) return

  console.log('[UPLOAD FILE] Uploading:', file.name)

  const response = await uploadFile(currentSectionId.value, file)

  if (response && response.status !== 200 && response.status !== 201) {
    throw new Error(response.message || 'Upload failed')
  }
}

function onUploadSuccess(files: File[]) {
  const fileName = files[0]?.name || 'File'
  toast.add({
    title: 'File berhasil diupload',
    description: `${fileName} telah ditambahkan`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })

  isUploadModalOpen.value = false
  fetchMateriSections()
}

function onUploadError(error: string) {
  toast.add({
    title: 'Error upload file',
    description: error,
    color: 'error',
    icon: 'i-lucide-alert-circle'
  })
}

async function handleDownloadFile(fileId: string, filename: string) {
  try {
    const blobUrl = await downloadFile(fileId)

    // Create temporary link to download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl)

    toast.add({
      title: 'File downloaded',
      description: `${filename} berhasil didownload`,
      color: 'success',
      icon: 'i-lucide-download'
    })
  } catch (error: any) {
    console.error('[DOWNLOAD FILE] Error:', error)
    toast.add({
      title: 'Error downloading file',
      description: formatErrorMessage(error, 'Failed to download file'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDeleteFile(fileId: string) {
  const confirmed = confirm('Yakin ingin menghapus file ini?')
  if (!confirmed) return

  try {
    const response = await deleteFile(fileId)

    if (response.status === 200) {
      toast.add({
        title: 'File dihapus',
        description: 'File telah dihapus',
        color: 'success',
        icon: 'i-lucide-trash-2'
      })

      await fetchMateriSections()
    } else {
      throw new Error('Failed to delete file')
    }
  } catch (error: any) {
    console.error('[DELETE FILE] Error:', error)
    toast.add({
      title: 'Error menghapus file',
      description: formatErrorMessage(error, 'Failed to delete file'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDeleteSection(sectionId: string) {
  const confirmed = confirm('Yakin ingin menghapus section ini? Semua file di dalamnya akan ikut terhapus.')
  if (!confirmed) return

  try {
    const response = await deleteSection(sectionId)

    if (response.status === 200) {
      toast.add({
        title: 'Section dihapus',
        description: 'Section telah dihapus',
        color: 'success',
        icon: 'i-lucide-trash-2'
      })

      await fetchMateriSections()
    } else {
      throw new Error('Failed to delete section')
    }
  } catch (error: any) {
    console.error('[DELETE SECTION] Error:', error)
    toast.add({
      title: 'Error menghapus section',
      description: formatErrorMessage(error, 'Failed to delete section'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Utility function for file icons
function getFileIconByType(mimetype: string): string {
  if (mimetype.includes('image')) return 'i-lucide-image'
  if (mimetype.includes('pdf')) return 'i-lucide-file-text'
  if (mimetype.includes('video')) return 'i-lucide-video'
  if (mimetype.includes('audio')) return 'i-lucide-music'
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return 'i-lucide-file-archive'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'i-lucide-file-text'
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'i-lucide-table'
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'i-lucide-presentation'
  return 'i-lucide-file'
}

// Utility function for file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Expose refresh method to parent
defineExpose({
  refresh: fetchMateriSections
})

// Watch kelasId changes
watch(() => props.kelasId, async (newId) => {
  if (newId) {
    await fetchMateriSections()
  }
}, { immediate: true })
</script>

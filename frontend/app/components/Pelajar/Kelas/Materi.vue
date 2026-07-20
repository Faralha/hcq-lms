<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Materi Kelas</h2>

    <!-- Loading State -->
    <div v-if="isLoadingMateri" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="materiSections.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-book-open-text" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada materi</p>
      <p class="text-sm text-[--ui-text-muted]">Belum ada materi untuk kelas ini</p>
    </div>

    <!-- Materi Sections List -->
    <div v-else class="grid gap-4">
      <UCard v-for="section in materiSections" :key="section.id">
        <div class="space-y-4">
          <!-- Section Header -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{{ section.judul }}</h3>
              <p v-if="section.deskripsi" class="text-sm text-[--ui-text-muted] mt-1">{{ section.deskripsi }}</p>
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
                <UButton icon="i-lucide-download" size="xs" color="primary" variant="ghost"
                  @click="handleDownloadFile(file.id, file.filename)" />
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-sm text-[--ui-text-muted]">
            Belum ada file
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MateriSection } from '~/composables/useMateriApi'

const props = defineProps<{
  kelasId: string
}>()

const toast = useToast()

// Composables
const { getSectionsByKelas, downloadFile } = useMateriApi()

// State
const materiSections = ref<MateriSection[]>([])
const isLoadingMateri = ref(false)

// Fetch materi sections
async function fetchMateriSections() {
  try {
    isLoadingMateri.value = true
    const response = await getSectionsByKelas(props.kelasId)
    materiSections.value = response.data || []
  } catch (error: any) {
    console.error('Error fetching materi sections:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat materi',
      color: 'error'
    })
  } finally {
    isLoadingMateri.value = false
  }
}

// Download file
async function handleDownloadFile(fileId: string, filename: string) {
  try {
    const url = await downloadFile(fileId)

    // Create download link
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.add({
      title: 'Berhasil',
      description: 'File berhasil diunduh',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengunduh file',
      color: 'error'
    })
  }
}

// Helper: Get file icon by mimetype
function getFileIconByType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'i-lucide-image'
  if (mimetype.includes('pdf')) return 'i-lucide-file-text'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'i-lucide-file-text'
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'i-lucide-sheet'
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'i-lucide-presentation'
  if (mimetype.includes('video')) return 'i-lucide-video'
  if (mimetype.includes('audio')) return 'i-lucide-music'
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('compressed')) return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Lifecycle
onMounted(() => {
  fetchMateriSections()
})

// Expose refresh method
defineExpose({
  refresh: fetchMateriSections
})
</script>

<!--
  UploadFile Component
  
  Komponen untuk upload file dengan drag & drop, validasi, dan progress bar.
  
  Props:
  - accept: string - Tipe file yang diterima (e.g., 'image/*', '.pdf,.doc,.docx')
  - multiple: boolean - Allow multiple files (default: false)
  - maxSize: number - Ukuran maksimal file dalam bytes (default: 50MB)
  - autoUpload: boolean - Upload otomatis saat file dipilih (default: false)
  - onUpload: (files: File[]) => Promise<void> - Custom upload handler function
  
  Events:
  - @success: Emit saat upload berhasil dengan array File[]
  - @error: Emit saat ada error dengan error message
  
  Contoh Penggunaan:
  
  <UploadFile
    accept=".pdf,.doc,.docx"
    :multiple="true"
    :max-size="10 * 1024 * 1024"
    :on-upload="handleUpload"
    @success="onUploadSuccess"
    @error="onUploadError"
  />
  
  async function handleUpload(files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    await api.post('/upload', formData)
  }
  
  function onUploadSuccess(files: File[]) {
    console.log('Upload success:', files)
  }
  
  function onUploadError(error: string) {
    console.error('Upload error:', error)
  }
-->

<template>
  <div class="space-y-4">
    <!-- File Input Area -->
    <div class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors" :class="[
      isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700',
      isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary cursor-pointer'
    ]" @drop.prevent="handleDrop" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
      @click="triggerFileInput">
      <input ref="fileInput" type="file" class="hidden" :accept="acceptedTypes" :multiple="multiple"
        @change="handleFileSelect" />

      <!-- Upload Icon & Text -->
      <div v-if="!isUploading" class="space-y-3">
        <UIcon :name="isDragging ? 'i-lucide-download' : 'i-lucide-upload'" class="w-12 h-12 mx-auto text-gray-400" />
        <div>
          <p class="text-lg font-medium">
            {{ isDragging ? 'Lepaskan file di sini' : 'Klik atau drag & drop file' }}
          </p>
          <p class="text-sm text-[--ui-text-muted] mt-1">
            {{ acceptedTypesLabel }}
          </p>
          <p v-if="maxSize" class="text-xs text-[--ui-text-muted] mt-1">
            Maksimal {{ formatFileSize(maxSize) }}
          </p>
        </div>
      </div>

      <!-- Uploading State -->
      <div v-else class="space-y-3">
        <UIcon name="i-lucide-loader-circle" class="w-12 h-12 mx-auto animate-spin text-primary" />
        <p class="text-lg font-medium">Mengupload file...</p>
        <div v-if="uploadProgress > 0" class="max-w-xs mx-auto">
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-primary transition-all duration-300" :style="{ width: `${uploadProgress}%` }" />
          </div>
          <p class="text-xs text-[--ui-text-muted] mt-1">{{ uploadProgress }}%</p>
        </div>
      </div>
    </div>

    <!-- Selected Files List -->
    <div v-if="selectedFiles.length > 0 && !isUploading" class="space-y-2">
      <p class="text-sm font-medium">File terpilih:</p>
      <div class="space-y-2">
        <div v-for="(file, index) in selectedFiles" :key="index"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <UIcon :name="getFileIcon(file.type)" class="w-5 h-5 text-primary shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ file.name }}</p>
              <p class="text-xs text-[--ui-text-muted]">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          <UButton icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="removeFile(index)" />
        </div>
      </div>
    </div>

    <!-- Upload Button -->
    <div v-if="selectedFiles.length > 0 && !autoUpload" class="flex gap-3">
      <UButton label="Upload File" icon="i-lucide-upload" size="lg" :loading="isUploading" :disabled="isUploading"
        @click="uploadFiles" />
      <UButton label="Batal" color="neutral" variant="outline" size="lg" :disabled="isUploading" @click="clearFiles" />
    </div>

    <!-- Error Message -->
    <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-alert-circle" :title="errorMessage"
      class="mt-4" @close="errorMessage = ''" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  // File type restrictions (e.g., 'image/*', '.pdf,.doc', etc.)
  accept?: string
  // Allow multiple files
  multiple?: boolean
  // Max file size in bytes (default 50MB)
  maxSize?: number
  // Auto upload when file selected
  autoUpload?: boolean
  // Custom upload handler
  onUpload?: (files: File[]) => Promise<void>
}>()

const emit = defineEmits<{
  success: [files: File[]]
  error: [error: string]
}>()

// Refs
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')

// Computed
const acceptedTypes = computed(() => props.accept || '*')

const acceptedTypesLabel = computed(() => {
  if (!props.accept || props.accept === '*') return 'Semua jenis file'

  const types = props.accept
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  const labels = Array.from(new Set(types.map(getAcceptLabel))).filter(Boolean)
  return labels.length === 1 ? labels[0] : labels.join(', ')
})

// Methods
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  errorMessage.value = ''

  // Validate file size
  const maxFileSize = props.maxSize || 50 * 1024 * 1024 // 50MB default
  const oversizedFiles = files.filter(f => f.size > maxFileSize)

  if (oversizedFiles.length > 0) {
    errorMessage.value = `File terlalu besar. Maksimal ${formatFileSize(maxFileSize)}`
    return
  }

  // Validate file type if specified
  if (props.accept && props.accept !== '*') {
    const acceptedExtensions = props.accept
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)

    const invalidFiles = files.filter(f => {
      const fileName = f.name.toLowerCase()
      const fileType = f.type.toLowerCase()

      return !acceptedExtensions.some(ext => {
        if (ext === '*') return true

        if (ext.startsWith('.')) return fileName.endsWith(ext)

        if (ext.endsWith('/*')) {
          const baseType = ext.split('/')[0]
          return baseType ? fileType.startsWith(`${baseType}/`) : false
        }

        if (ext.includes('/')) return fileType === ext

        return fileName.endsWith(`.${ext}`) || fileType === ext
      })
    })

    if (invalidFiles.length > 0) {
      errorMessage.value = `Jenis file tidak valid. Hanya ${acceptedTypesLabel.value}`
      return
    }
  }

  if (props.multiple) {
    selectedFiles.value.push(...files)
  } else {
    selectedFiles.value = files[0] ? [files[0]] : []
  }

  if (props.autoUpload) {
    uploadFiles()
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
  selectedFiles.value = []
  errorMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''

  try {
    // Simulate progress (you can replace this with actual upload progress)
    const progressInterval = setInterval(() => {
      uploadProgress.value = Math.min(uploadProgress.value + 10, 90)
    }, 200)

    // Call custom upload handler if provided
    if (props.onUpload) {
      await props.onUpload(selectedFiles.value)
    }

    clearInterval(progressInterval)
    uploadProgress.value = 100

    emit('success', selectedFiles.value)

    // Clear after successful upload
    setTimeout(() => {
      clearFiles()
      uploadProgress.value = 0
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal mengupload file'
    emit('error', errorMessage.value)
  } finally {
    isUploading.value = false
  }
}

// Utility functions
function getAcceptLabel(type: string): string {
  const normalized = type.toLowerCase()

  if (normalized === '*') return 'Semua jenis file'
  if (normalized.startsWith('.')) return normalized.replace('.', '').toUpperCase()
  if (normalized.includes('image')) return 'Gambar'
  if (normalized.includes('video')) return 'Video'
  if (normalized.includes('audio')) return 'Audio'
  if (normalized.includes('pdf')) return 'PDF'
  if (normalized.includes('word') || normalized.includes('doc')) return 'Word'
  if (normalized.includes('sheet') || normalized.includes('excel') || normalized.includes('spreadsheet')) return 'Spreadsheet'
  if (normalized.includes('presentation') || normalized.includes('powerpoint') || normalized.includes('ppt')) return 'Presentasi'
  if (normalized.includes('text') || normalized === 'txt') return 'TXT'

  return normalized.toUpperCase()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (type: string): string => {
  if (type.includes('image')) return 'i-lucide-image'
  if (type.includes('pdf')) return 'i-lucide-file-text'
  if (type.includes('video')) return 'i-lucide-video'
  if (type.includes('audio')) return 'i-lucide-music'
  if (type.includes('zip') || type.includes('compressed')) return 'i-lucide-file-archive'
  if (type.includes('word') || type.includes('document')) return 'i-lucide-file-text'
  if (type.includes('sheet') || type.includes('excel')) return 'i-lucide-table'
  if (type.includes('presentation') || type.includes('powerpoint')) return 'i-lucide-presentation'
  return 'i-lucide-file'
}
</script>

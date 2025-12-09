<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Detail Kelas</p>
      <h1 class="text-3xl font-bold">{{ kelasDetail?.namaKelas || 'Loading...' }}</h1>
      <p class="text-lg text-[--ui-text-muted]">
        {{ kelasDetail?.mataPelajaran?.nama }} • {{ kelasDetail?.jadwalHari }} {{ kelasDetail?.jadwalJam }}
      </p>
    </div>

    <!-- Tombol Mulai Sesi Presensi -->
    <div class="flex gap-3">
      <UButton label="Mulai Sesi Presensi" icon="i-lucide-qr-code" size="lg" :loading="isStartingSession"
        :disabled="hasActiveSession" @click="handleStartSession" />
    </div>

    <!-- Kode Presensi Aktif (jika ada) -->
    <UAlert v-if="activeSession" color="success" variant="subtle" icon="i-lucide-radio" title="Sesi Presensi Aktif">
      <template #description>
        <div class="flex flex-col gap-3">
          <!-- Kode Presensi -->
          <div class="flex items-center gap-3">
            <span class="text-2xl font-mono font-bold">{{ activeSession.kode }}</span>
            <UButton label="Copy Kode" size="xs" color="success" variant="outline" icon="i-lucide-copy"
              @click="copyCode" />
            <UButton label="Hentikan Sesi" size="xs" color="error" variant="outline" icon="i-lucide-square"
              :loading="isStoppingSession" @click="handleStopSession" />
          </div>

          <!-- Countdown Timer -->
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-timer" class="w-4 h-4" />
              <span class="font-mono font-semibold">{{ countdown }}</span>
              <span class="opacity-75">tersisa</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clock" class="w-4 h-4" />
              <span class="opacity-75">Berakhir pukul</span>
              <span class="font-mono font-semibold">{{ expiresAtFormatted }}</span>
            </div>
          </div>

          <p class="text-sm opacity-75">
            Bagikan kode ini kepada pelajar untuk melakukan presensi
          </p>
        </div>
      </template>
    </UAlert>

    <!-- Materi Kelas -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Materi Kelas</h2>
        <UButton label="Tambah Section" icon="i-lucide-plus" size="sm" @click="openCreateSectionModal" />
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
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold">{{ section.judul }}</h3>
                <p v-if="section.deskripsi" class="text-sm text-[--ui-text-muted] mt-1">{{ section.deskripsi }}</p>
              </div>
              <div class="flex gap-2">
                <UButton icon="i-lucide-upload" size="xs" color="primary" variant="outline"
                  @click="openUploadModal(section.id)" />
                <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost"
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
                  <UButton icon="i-lucide-download" size="xs" color="primary" variant="ghost"
                    @click="handleDownloadFile(file.id, file.filename)" />
                  <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost"
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
    </div>

    <!-- List Sesi Presensi -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Riwayat Sesi Presensi</h2>

      <!-- Loading State -->
      <div v-if="isLoadingSessions" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="presensiSessions.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
        <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada sesi presensi</p>
        <p class="text-sm text-[--ui-text-muted]">Mulai sesi presensi untuk mencatat kehadiran pelajar</p>
      </div>

      <!-- Sessions List -->
      <div v-else class="grid gap-4">
        <UCard v-for="session in presensiSessions" :key="session.id"
          class="hover:border-primary transition-colors cursor-pointer" @click="handleEditPresensi(session.id)">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <UIcon :name="session.isActive ? 'i-lucide-radio' : 'i-lucide-check-circle'" :class="[
                'w-10 h-10',
                session.isActive ? 'text-success animate-pulse' : 'text-[--ui-text-muted]'
              ]" />
              <div>
                <p class="font-semibold text-lg">
                  {{ new Date(session.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) }}
                </p>
                <p class="text-sm text-[--ui-text-muted]">
                  Kode: <span class="font-mono font-bold">{{ session.kode }}</span>
                  <UBadge :label="session.isActive ? 'Sedang Berlangsung' : 'Selesai'"
                    :color="session.isActive ? 'success' : 'neutral'" variant="subtle" class="ml-2" />
                </p>
              </div>
            </div>
            <UButton label="Edit Presensi" icon="i-lucide-edit" color="primary" variant="outline" size="sm" />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Modal Edit Presensi -->
    <UModal v-model:open="isModalOpen" :ui="{ content: 'sm:max-w-4xl' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Edit Presensi</h3>
            <p class="text-sm text-[--ui-text-muted]">
              {{ selectedSession ? new Date(selectedSession.tanggal).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '' }}
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <!-- Status & Kode Presensi -->
        <div class="mb-6 p-4 bg-elevated rounded-lg border border-accented">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-[--ui-text-muted]">Status Sesi</p>
            <UBadge :label="selectedSession?.isActive ? 'Aktif' : 'Selesai'"
              :color="selectedSession?.isActive ? 'success' : 'neutral'" variant="subtle" />
          </div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-[--ui-text-muted]">Kode Presensi:</p>
            <p class="text-xl font-mono font-bold">{{ selectedSession?.kode }}</p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingRecords" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
        </div>

        <!-- Table Presensi -->
        <div v-else class="flex flex-col border border-accented rounded-lg overflow-hidden">
          <UTable ref="presensiTable" :data="presensiRecords" :columns="presensiColumns" class="flex-1" />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Tutup" color="neutral" variant="outline" @click="isModalOpen = false" />
        </div>
      </template>
    </UModal>

    <!-- Modal Create Section -->
    <UModal v-model:open="isCreateSectionModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #header>
        <h3 class="text-lg font-semibold">Tambah Section Materi</h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Judul Section</label>
            <UInput v-model="newSection.judul" placeholder="Masukkan judul section" size="lg" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Deskripsi (Opsional)</label>
            <UTextarea v-model="newSection.deskripsi" placeholder="Masukkan deskripsi" :rows="3" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="outline" @click="isCreateSectionModalOpen = false" />
          <UButton label="Simpan" icon="i-lucide-save" :loading="isCreatingSection" @click="handleCreateSection" />
        </div>
      </template>
    </UModal>

    <!-- Modal Upload File -->
    <UModal v-model:open="isUploadModalOpen" :ui="{ content: 'sm:max-w-2xl' }">
      <template #header>
        <h3 class="text-lg font-semibold">Upload File Materi</h3>
      </template>

      <template #body>
        <UploadFile accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" :multiple="false" :max-size="50 * 1024 * 1024"
          :on-upload="handleUploadFile" @success="onUploadSuccess" @error="onUploadError" />
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton label="Tutup" color="neutral" variant="outline" @click="isUploadModalOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Kelas } from '~/composables/useKelasApi'
import type { PresensiSession, PresensiRecord } from '~/composables/usePresensiApi'
import type { MateriSection } from '~/composables/useMateriApi'

const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false
})

const route = useRoute()
const toast = useToast()
const kelasId = computed(() => route.params.id as string)

// Composables
const { getKelasById } = useKelasApi()
const { startKelas, stopSession, getPresensiBySession, manualPresensi, getPresensiByKelas } = usePresensiApi()
const { createSection, getSectionsByKelas, deleteSection, uploadFile, downloadFile, deleteFile } = useMateriApi()

// State
const kelasDetail = ref<Kelas | null>(null)
const presensiSessions = ref<PresensiSession[]>([])
const activeSession = ref<PresensiSession | null>(null)
const selectedSession = ref<PresensiSession | null>(null)
const presensiRecords = ref<PresensiRecord[]>([])

// Materi state
const materiSections = ref<MateriSection[]>([])
const isLoadingMateri = ref(false)
const isCreateSectionModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isCreatingSection = ref(false)
const currentSectionId = ref<string>('')
const newSection = ref({
  judul: '',
  deskripsi: ''
})

const isLoadingSessions = ref(false)
const isStartingSession = ref(false)
const isStoppingSession = ref(false)
const isModalOpen = ref(false)
const isLoadingRecords = ref(false)

// Countdown timer
const countdown = ref<string>('')
const expiresAtFormatted = ref<string>('')
let countdownInterval: number | null = null

// Countdown functions
const updateCountdown = () => {
  if (!activeSession.value) {
    countdown.value = ''
    expiresAtFormatted.value = ''
    return
  }

  const now = new Date().getTime()
  const expiresAt = new Date(activeSession.value.tanggal).getTime() + (3 * 60 * 60 * 1000) // +3 hours from creation
  const distance = expiresAt - now

  if (distance <= 0) {
    countdown.value = 'Expired'
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
    return
  }

  const hours = Math.floor(distance / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  countdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const expiresDate = new Date(expiresAt)
  expiresAtFormatted.value = expiresDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const startCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
}

const clearCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  countdown.value = ''
  expiresAtFormatted.value = ''
}

// Cleanup on unmount
onUnmounted(() => {
  clearCountdown()
})

// Computed
const hasActiveSession = computed(() => {
  return presensiSessions.value.some(s => s.isActive)
})

// Status options
const statusOptions = [
  { label: 'Hadir', value: 'HADIR' },
  { label: 'Sakit', value: 'SAKIT' },
  { label: 'Izin', value: 'IZIN' },
  { label: 'Alfa', value: 'ALFA' }
]

// Table Columns
const presensiColumns: TableColumn<PresensiRecord>[] = [
  {
    accessorKey: 'user.nama',
    header: 'Nama Pelajar',
    cell: ({ row }) => {
      return h('div', {}, [
        h('p', { class: 'font-medium text-[--ui-text-highlighted]' }, row.original.user.nama),
        h('p', { class: 'text-sm text-[--ui-text-muted]' }, row.original.user.email)
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = {
        HADIR: 'success' as const,
        SAKIT: 'warning' as const,
        IZIN: 'primary' as const,
        ALFA: 'error' as const
      }[status] || 'neutral' as const

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color
      }, () => status.toLowerCase())
    }
  },
  {
    accessorKey: 'timestamp',
    header: 'Waktu',
    cell: ({ row }) => {
      return new Date(row.getValue('timestamp')).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  {
    id: 'actions',
    header: 'Ubah Status',
    cell: ({ row }) => {
      return h(USelect, {
        modelValue: row.original.status,
        options: statusOptions,
        placeholder: 'Pilih status',
        size: 'sm',
        'onUpdate:modelValue': (value: string) => handleUpdateStatus(row.original, value as PresensiRecord['status'])
      })
    }
  }
]

// Methods
async function fetchKelasDetail() {
  try {
    console.log('[KELAS DETAIL] Fetching kelas:', kelasId.value)
    const response = await getKelasById(kelasId.value)

    console.log('[KELAS DETAIL] Response:', response)
    console.log('[KELAS DETAIL] Response type:', typeof response)

    // API returns Kelas object directly, not wrapped in ApiResponse
    kelasDetail.value = response
  } catch (error: any) {
    console.error('[KELAS DETAIL] Error:', error)
    toast.add({
      title: 'Error loading kelas detail',
      description: error.message || 'Failed to fetch kelas data',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function fetchPresensiSessions() {
  isLoadingSessions.value = true
  try {
    console.log('[PRESENSI SESSIONS] Fetching sessions for kelas:', kelasId.value)
    const response = await getPresensiByKelas(kelasId.value)

    console.log('[PRESENSI SESSIONS] Response:', response)
    console.log('[PRESENSI SESSIONS] Response type:', typeof response)

    // Backend returns direct object: { kelas, sessions }
    // Check multiple response formats
    let sessionsData: any[] = []

    if (response && typeof response === 'object') {
      // Format 1: { success, data: { sessions } }
      if ('success' in response && response.success && response.data?.sessions) {
        sessionsData = response.data.sessions
      }
      // Format 2: { sessions } directly
      else if ('sessions' in response && Array.isArray(response.sessions)) {
        sessionsData = response.sessions
      }
      // Format 3: Array directly
      else if (Array.isArray(response)) {
        sessionsData = response
      }
    }

    console.log('[PRESENSI SESSIONS] Sessions data:', sessionsData)

    // Map sessions to PresensiSession format
    if (sessionsData.length > 0) {
      presensiSessions.value = sessionsData.map(session => ({
        id: session.id,
        kode: session.kode,
        tanggal: session.createdAt || session.tanggal,
        isActive: session.isActive ?? (new Date(session.expiresAt) > new Date()),
        kelas: kelasDetail.value!
      }))

      // Find active session
      activeSession.value = presensiSessions.value.find(s => s.isActive) || null

      console.log('[PRESENSI SESSIONS] Loaded sessions:', presensiSessions.value.length)
      console.log('[PRESENSI SESSIONS] Active session:', activeSession.value?.kode)

      // Start countdown if there's an active session
      if (activeSession.value) {
        startCountdown()
      } else {
        clearCountdown()
      }
    } else {
      presensiSessions.value = []
      activeSession.value = null
    }
  } catch (error: any) {
    console.error('[PRESENSI SESSIONS] Error:', error)
    toast.add({
      title: 'Error loading presensi sessions',
      description: error.message || 'Failed to fetch sessions',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    presensiSessions.value = []
    activeSession.value = null
  } finally {
    isLoadingSessions.value = false
  }
}

async function handleStartSession() {
  isStartingSession.value = true
  try {
    const response = await startKelas(kelasId.value)

    console.log('[START SESSION] Response:', response)

    if (response.success && response.data) {
      activeSession.value = response.data.session
      presensiSessions.value.unshift(response.data.session)

      // Start countdown for new session
      startCountdown()

      toast.add({
        title: 'Sesi presensi dimulai',
        description: `Kode presensi: ${response.data.kode}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Refetch sessions to get updated data
      await fetchPresensiSessions()
    }
  } catch (error: any) {
    console.error('[START SESSION] Error:', error)
    toast.add({
      title: 'Error memulai sesi',
      description: error.message || 'Failed to start session',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isStartingSession.value = false
  }
}

async function handleStopSession() {
  if (!activeSession.value) return

  isStoppingSession.value = true
  try {
    const response = await stopSession(activeSession.value.id)

    console.log('[STOP SESSION] Response:', response)

    if (response.success) {
      toast.add({
        title: 'Sesi dihentikan',
        description: 'Sesi presensi telah berhasil dihentikan',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      activeSession.value = null
      clearCountdown()
      await fetchPresensiSessions()
    }
  } catch (error: any) {
    console.error('[STOP SESSION] Error:', error)
    toast.add({
      title: 'Error menghentikan sesi',
      description: error.message || 'Failed to stop session',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isStoppingSession.value = false
  }
}

async function handleEditPresensi(sessionId: string) {
  isModalOpen.value = true
  selectedSession.value = presensiSessions.value.find(s => s.id === sessionId) || null

  await fetchPresensiRecords(sessionId)
}

async function fetchPresensiRecords(sessionId: string) {
  isLoadingRecords.value = true
  try {
    const response = await getPresensiBySession(sessionId)

    console.log('[PRESENSI RECORDS] Response:', response)

    if (response.success && response.data) {
      presensiRecords.value = response.data.records || []
    }
  } catch (error: any) {
    console.error('[PRESENSI RECORDS] Error:', error)
    toast.add({
      title: 'Error loading presensi records',
      description: error.message || 'Failed to fetch records',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoadingRecords.value = false
  }
}

async function handleUpdateStatus(record: PresensiRecord, newStatus: PresensiRecord['status']) {
  if (!selectedSession.value) return

  try {
    const response = await manualPresensi(selectedSession.value.id, {
      pelajarId: record.user.id,
      status: newStatus
    })

    console.log('[UPDATE STATUS] Response:', response)

    if (response.success) {
      // Update local state
      const index = presensiRecords.value.findIndex(r => r.id === record.id)
      if (index !== -1 && presensiRecords.value[index]) {
        presensiRecords.value[index].status = newStatus
      }

      toast.add({
        title: 'Status presensi diupdate',
        description: `${record.user.nama} - ${newStatus}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Refetch records to get updated data
      await fetchPresensiRecords(selectedSession.value.id)

      // Also refetch sessions to update the list
      await fetchPresensiSessions()
    }
  } catch (error: any) {
    console.error('[UPDATE STATUS] Error:', error)
    toast.add({
      title: 'Error updating status',
      description: error.message || 'Failed to update status',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

function copyCode() {
  if (!activeSession.value) return

  navigator.clipboard.writeText(activeSession.value.kode)
  toast.add({
    title: 'Kode disalin',
    description: 'Kode presensi telah disalin ke clipboard',
    color: 'success',
    icon: 'i-lucide-copy'
  })
}

// Materi functions
async function fetchMateriSections() {
  isLoadingMateri.value = true
  try {
    console.log('[MATERI] Fetching sections for kelas:', kelasId.value)
    const response = await getSectionsByKelas(kelasId.value)

    console.log('[MATERI] Response:', response)

    // API returns array directly (like useKelasApi)
    materiSections.value = response
  } catch (error: any) {
    console.error('[MATERI] Error:', error)
    toast.add({
      title: 'Error loading materi',
      description: error.message || 'Failed to fetch materi',
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
      kelasId: kelasId.value,
      judul: newSection.value.judul,
      deskripsi: newSection.value.deskripsi || undefined
    })

    console.log('[CREATE SECTION] Response:', response)

    toast.add({
      title: 'Section berhasil dibuat',
      description: 'Section materi telah ditambahkan',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    isCreateSectionModalOpen.value = false
    await fetchMateriSections()
  } catch (error: any) {
    console.error('[CREATE SECTION] Error:', error)
    toast.add({
      title: 'Error membuat section',
      description: error.message || 'Failed to create section',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isCreatingSection.value = false
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

  await uploadFile(currentSectionId.value, file)
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
      description: error.message || 'Failed to download file',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDeleteFile(fileId: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) return

  try {
    await deleteFile(fileId)

    toast.add({
      title: 'File dihapus',
      description: 'File telah dihapus',
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    await fetchMateriSections()
  } catch (error: any) {
    console.error('[DELETE FILE] Error:', error)
    toast.add({
      title: 'Error menghapus file',
      description: error.message || 'Failed to delete file',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDeleteSection(sectionId: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus section ini? Semua file di dalamnya akan ikut terhapus.')) return

  try {
    await deleteSection(sectionId)

    toast.add({
      title: 'Section dihapus',
      description: 'Section materi telah dihapus',
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    await fetchMateriSections()
  } catch (error: any) {
    console.error('[DELETE SECTION] Error:', error)
    toast.add({
      title: 'Error menghapus section',
      description: error.message || 'Failed to delete section',
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

// Fetch data when kelas ID changes
watch(() => kelasId.value, async () => {
  if (kelasId.value) {
    await fetchKelasDetail()
    await fetchPresensiSessions()
    await fetchMateriSections()
  }
}, { immediate: true })
</script>
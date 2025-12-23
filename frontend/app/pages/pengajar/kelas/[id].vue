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
    <div class="flex gap-3 flex-wrap">
      <UButton label="Mulai Sesi Presensi" icon="i-lucide-qr-code" size="lg" :loading="isStartingSession"
        :disabled="hasActiveSession" @click="handleStartSession" />
      <UButton label="Tambah Announcement" icon="i-lucide-megaphone" size="lg" color="primary" variant="outline"
        @click="openCreateAnnouncementModal" />
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

    <!-- Announcements -->
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
    </div>

    <!-- List Sesi Presensi -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Riwayat Sesi Presensi</h2>

      <UTable ref="sessionsTable" v-model:pagination="sessionsPagination" :data="presensiSessions"
        :columns="sessionsColumns" :loading="isLoadingSessions"
        :empty="presensiSessions.length === 0 ? 'Belum ada sesi presensi. Mulai sesi presensi untuk mencatat kehadiran pelajar.' : undefined"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="border border-accented rounded-lg overflow-hidden" />

      <div v-if="presensiSessions.length > 0" class="flex justify-end">
        <UPagination :page="(sessionsTable?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="sessionsTable?.tableApi?.getState().pagination.pageSize || 5"
          :total="sessionsTable?.tableApi?.getFilteredRowModel().rows.length || 0"
          @update:page="(p) => sessionsTable?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>

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
                <UButton icon="i-lucide-edit" size="xs" color="primary" variant="ghost"
                  @click="openEditSectionModal(section)" />
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

    <!-- Modal Edit Presensi -->
    <UModal v-model:open="isModalOpen" :ui="{ content: 'sm:max-w-4xl' }">
      <template #content>
        <UCard>
          <template #header>
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
          </template>

          <div class="space-y-4">
            <!-- Status & Kode Presensi -->
            <div class="p-4 bg-elevated rounded-lg border border-accented">
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
              <UTable :key="presensiRecords.map(r => `${r.id}-${r.status}`).join('-')" :data="presensiRecords"
                :columns="presensiColumns" class="flex-1" />
            </div>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Tutup" color="neutral" variant="outline"
                @click="isModalOpen = false" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

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
import type { TableColumn } from '@nuxt/ui'
import type { Kelas } from '~/composables/useKelasApi'
import type { PresensiSession, PresensiRecord } from '~/composables/usePresensiApi'
import type { MateriSection } from '~/composables/useMateriApi'
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '~/composables/useAnnouncementApi'

const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false
})

const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const kelasId = computed(() => route.params.id as string)

// Composables
const { getKelasById } = useKelasApi()
const { startKelas, stopSession, getPresensiBySession, manualPresensi, getPresensiByKelas } = usePresensiApi()
const { createSection, getSectionsByKelas, updateSection, deleteSection, uploadFile, downloadFile, deleteFile } = useMateriApi()
const { createAnnouncement, getAllAnnouncements, updateAnnouncement, deleteAnnouncement } = useAnnouncementApi()

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

// Announcement state
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

const isLoadingSessions = ref(false)
const isStartingSession = ref(false)
const isStoppingSession = ref(false)
const isModalOpen = ref(false)
const isLoadingRecords = ref(false)

// Pagination state
const sessionsPagination = ref({
  pageIndex: 0,
  pageSize: 5
})
const sessionsTable = useTemplateRef('sessionsTable')

const announcementsPagination = ref({
  pageIndex: 0,
  pageSize: 3
})
const announcementsTable = useTemplateRef('announcementsTable')

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

// Sessions Table Columns
const sessionsColumns: TableColumn<PresensiSession>[] = [
  {
    accessorKey: 'id',
    header: 'No',
    cell: ({ row }) => {
      return presensiSessions.value.indexOf(row.original) + 1
    }
  },
  {
    accessorKey: 'tanggal',
    header: 'Tanggal Presensi',
    cell: ({ row }) => {
      return new Date(row.getValue('tanggal')).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  },
  {
    accessorKey: 'kode',
    header: 'Kode Presensi',
    cell: ({ row }) => {
      return h('span', { class: 'font-mono font-bold' }, row.getValue('kode'))
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return h(UBadge, {
        label: isActive ? 'Aktif' : 'Selesai',
        color: isActive ? 'success' : 'neutral',
        variant: 'subtle'
      })
    }
  },
  {
    id: 'attendance',
    header: 'Jumlah Hadir',
    cell: ({ row }) => {
      const records = row.original.records || []
      const hadirCount = records.filter(r => r.status === 'HADIR').length
      const totalCount = records.length
      return h('span', { class: 'font-medium' }, `${hadirCount}/${totalCount}`)
    }
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      return h(UButton, {
        label: 'Edit',
        icon: 'i-lucide-edit',
        size: 'xs',
        color: 'primary',
        variant: 'outline',
        onClick: (e: Event) => {
          e.stopPropagation()
          handleEditPresensi(row.original.id)
        }
      })
    }
  }
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
        items: statusOptions,
        valueKey: 'value',
        placeholder: 'Pilih status',
        size: 'sm',
        class: 'w-32',
        'onUpdate:modelValue': async (value: string) => {
          // Update local state immediately for instant UI feedback
          row.original.status = value as PresensiRecord['status']
          // Then sync with backend
          await handleUpdateStatus(row.original, value as PresensiRecord['status'])
        }
      })
    }
  }
]

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

// Helper function to format error messages
function formatErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  // If error.message is an array, join it
  if (Array.isArray(error.message)) {
    return error.message.join(', ')
  }

  // If error.errors is an array, join it
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.join(', ')
  }

  // Otherwise return the message or fallback
  return error.message || error.data?.message || fallback
}

// Methods
async function fetchKelasDetail() {
  try {
    console.log('[KELAS DETAIL] Fetching kelas:', kelasId.value)
    const response = await getKelasById(kelasId.value)

    console.log('[KELAS DETAIL] Response:', response)
    console.log('[KELAS DETAIL] Response type:', typeof response)

    // API returns Kelas object directly, not wrapped in ApiResponse
    if (response.status === 200 && response.data) {
      kelasDetail.value = response.data
    }
  } catch (error: any) {
    console.error('[KELAS DETAIL] Error:', error)
    toast.add({
      title: 'Error loading kelas detail',
      description: formatErrorMessage(error, 'Failed to fetch kelas data'),
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

    if (response.status === 200 && response.data) {
      if (Array.isArray(response.data)) {
        sessionsData = response.data
      } else if (response.data.sessions) {
        sessionsData = response.data.sessions
      }
    }

    console.log('[PRESENSI SESSIONS] Sessions data:', sessionsData)

    // Map sessions to PresensiSession format
    if (sessionsData.length > 0) {
      presensiSessions.value = sessionsData
        .map(session => ({
          id: session.id,
          kelasId: session.kelasId || kelasId.value,
          kode: session.kode,
          tanggal: session.createdAt || session.tanggal,
          expiresAt: session.expiresAt || '',
          isActive: session.isActive ?? (new Date(session.expiresAt) > new Date()),
          kelas: kelasDetail.value!,
          records: session.records || session.presensiRecords || [],
          createdAt: session.createdAt || '',
          updatedAt: session.updatedAt || ''
        }))
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()) // Sort by newest first

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
      description: formatErrorMessage(error, 'Failed to fetch sessions'),
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

    if (response.status === 201 && response.data) {
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
      description: formatErrorMessage(error, 'Failed to start session'),
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

    if (response.status === 201) {
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
      description: formatErrorMessage(error, 'Failed to stop session'),
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

    if (response.status === 200 && response.data) {
      // Backend returns data.presensiRecords array directly
      const records = response.data.presensiRecords || []

      // Map the records to match our PresensiRecord type structure
      presensiRecords.value = records.map((record: any) => ({
        id: record.id,
        sessionId: record.presensiSessionId,
        userId: record.userId,
        status: record.status,
        isManual: record.isManual,
        timestamp: record.createdAt || record.updatedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        user: {
          id: record.user.id,
          nama: record.user.nama,
          email: record.user.email,
          role: record.user.role,
          fullName: record.user.fullName,
          phoneNumber: record.user.phoneNumber,
          address: record.user.address,
          cities: record.user.cities,
          createdAt: record.user.createdAt,
          updatedAt: record.user.updatedAt
        }
      }))

      console.log('[PRESENSI RECORDS] Loaded records:', presensiRecords.value.length)
    }
  } catch (error: any) {
    console.error('[PRESENSI RECORDS] Error:', error)
    toast.add({
      title: 'Error loading presensi records',
      description: formatErrorMessage(error, 'Failed to fetch records'),
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

    if (response.status === 200 || response.status === 201) {
      // Update the record in presensiRecords array for persistence
      const index = presensiRecords.value.findIndex(r => r.id === record.id)
      if (index !== -1) {
        presensiRecords.value[index] = {
          ...presensiRecords.value[index]!,
          status: newStatus,
          isManual: true,
          updatedAt: new Date().toISOString()
        }
      }
    }
  } catch (error: any) {
    console.error('[UPDATE STATUS] Error:', error)

    // Revert the UI change by refetching
    if (selectedSession.value) {
      await fetchPresensiRecords(selectedSession.value.id)
    }

    toast.add({
      title: 'Error updating status',
      description: formatErrorMessage(error, 'Failed to update status'),
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
      kelasId: kelasId.value,
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
        description: 'Section materi telah diperbarui',
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
} async function handleDeleteFile(fileId: string) {
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
        description: 'Section materi telah dihapus',
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

// Announcement functions
async function fetchClassAnnouncements() {
  isLoadingAnnouncements.value = true
  try {
    console.log('[ANNOUNCEMENTS] Fetching announcements for kelas:', kelasId.value)
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
    kelasId: kelasId.value
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
    newAnnouncement.value.kelasId = kelasId.value
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

// Fetch data when kelas ID changes
watch(() => kelasId.value, async () => {
  if (kelasId.value) {
    await fetchKelasDetail()
    await fetchPresensiSessions()
    await fetchMateriSections()
    await fetchClassAnnouncements()
  }
}, { immediate: true })
</script>
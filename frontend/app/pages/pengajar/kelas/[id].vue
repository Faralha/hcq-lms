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
        @click="announcementComponent?.openModal()" />
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
    <PengajarKelasAnnouncement ref="announcementComponent" :kelas-id="kelasId" />

    <!-- List Sesi Presensi -->
    <PengajarKelasPresensi ref="presensiComponent" :kelas-id="kelasId" :kelas-detail="kelasDetail"
      @update:active-session="activeSession = $event" />

    <!-- Materi Kelas -->
    <PengajarKelasMateri ref="materiComponent" :kelas-id="kelasId" />

  </div>
</template>

<script setup lang="ts">
import type { Kelas } from '~/composables/useKelasApi'
import type { PresensiSession } from '~/composables/usePresensiApi'

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
const { startKelas, stopSession } = usePresensiApi()

// State
const kelasDetail = ref<Kelas | null>(null)
const activeSession = ref<PresensiSession | null>(null)

const isStartingSession = ref(false)
const isStoppingSession = ref(false)

// Component refs
const presensiComponent = ref<any>(null)
const announcementComponent = ref<any>(null)

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

// Computed
const hasActiveSession = computed(() => {
  return activeSession.value !== null
})

// Cleanup on unmount
onUnmounted(() => {
  clearCountdown()
})

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

async function handleStartSession() {
  isStartingSession.value = true
  try {
    const response = await startKelas(kelasId.value)

    console.log('[START SESSION] Response:', response)

    if (response.status === 201 && response.data) {
      activeSession.value = response.data.session

      // Start countdown for new session
      startCountdown()

      toast.add({
        title: 'Sesi presensi dimulai',
        description: `Kode presensi: ${response.data.kode}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Refresh presensi component
      presensiComponent.value?.refresh()
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

      // Refresh presensi component
      presensiComponent.value?.refresh()
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


// Fetch data when kelas ID changes
watch(() => kelasId.value, async () => {
  if (kelasId.value) {
    await fetchKelasDetail()
  }
}, { immediate: true })
</script>
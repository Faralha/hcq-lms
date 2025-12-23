<template>
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
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import type { Kelas } from '~/composables/useKelasApi'
import type { PresensiSession, PresensiRecord } from '~/composables/usePresensiApi'

const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')
const UButton = resolveComponent('UButton')

// Props
const props = defineProps<{
  kelasId: string
  kelasDetail: Kelas | null
}>()

// Emits
const emit = defineEmits<{
  'update:activeSession': [session: PresensiSession | null]
}>()

const toast = useToast()

// Composables
const { getPresensiBySession, manualPresensi, getPresensiByKelas } = usePresensiApi()

// State
const presensiSessions = ref<PresensiSession[]>([])
const selectedSession = ref<PresensiSession | null>(null)
const presensiRecords = ref<PresensiRecord[]>([])

const isLoadingSessions = ref(false)
const isModalOpen = ref(false)
const isLoadingRecords = ref(false)

// Pagination state
const sessionsPagination = ref({
  pageIndex: 0,
  pageSize: 5
})
const sessionsTable = useTemplateRef('sessionsTable')

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
        size: 'xs',
        color: 'primary',
        variant: 'outline',
        onClick: () => handleEditPresensi(row.original.id)
      })
    }
  }
]

// Table Columns for records
const presensiColumns: TableColumn<PresensiRecord>[] = [
  {
    accessorKey: 'user.nama',
    header: 'Nama Pelajar',
    cell: ({ row }) => {
      return h('div', {}, [
        h('p', { class: 'font-medium' }, row.original.user.nama),
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
        IZIN: 'info' as const,
        ALFA: 'error' as const
      }[status] || 'neutral' as const

      return h(UBadge, {
        label: status,
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

// Methods
async function fetchPresensiSessions() {
  isLoadingSessions.value = true
  try {
    console.log('[PRESENSI SESSIONS] Fetching sessions for kelas:', props.kelasId)
    const response = await getPresensiByKelas(props.kelasId)

    console.log('[PRESENSI SESSIONS] Response:', response)

    let sessionsData: any[] = []

    if (response.status === 200 && response.data) {
      if (Array.isArray(response.data)) {
        sessionsData = response.data
      } else if (response.data.sessions) {
        sessionsData = response.data.sessions
      }
    }

    if (sessionsData.length > 0) {
      presensiSessions.value = sessionsData
        .map(session => ({
          id: session.id,
          kelasId: session.kelasId || props.kelasId,
          kode: session.kode,
          tanggal: session.createdAt || session.tanggal,
          expiresAt: session.expiresAt || '',
          isActive: session.isActive ?? (new Date(session.expiresAt) > new Date()),
          kelas: props.kelasDetail!,
          records: session.records || session.presensiRecords || [],
          createdAt: session.createdAt || '',
          updatedAt: session.updatedAt || ''
        }))
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

      // Find active session and emit
      const activeSession = presensiSessions.value.find(s => s.isActive) || null
      emit('update:activeSession', activeSession)
    } else {
      presensiSessions.value = []
      emit('update:activeSession', null)
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
    emit('update:activeSession', null)
  } finally {
    isLoadingSessions.value = false
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
      if (Array.isArray(response.data)) {
        presensiRecords.value = response.data
      } else if (response.data.records) {
        presensiRecords.value = response.data.records
      } else if (response.data.presensiRecords) {
        presensiRecords.value = response.data.presensiRecords
      }
    }
  } catch (error: any) {
    console.error('[PRESENSI RECORDS] Error:', error)
    toast.add({
      title: 'Error loading records',
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
      pelajarId: record.userId,
      status: newStatus
    })

    console.log('[UPDATE STATUS] Response:', response)

    if (response.status === 200 || response.status === 201) {
      toast.add({
        title: 'Status diupdate',
        description: `Status presensi ${record.user.nama} berhasil diubah`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Refresh sessions list
      await fetchPresensiSessions()
    }
  } catch (error: any) {
    console.error('[UPDATE STATUS] Error:', error)

    // Revert the UI change by refetching
    if (selectedSession.value) {
      await fetchPresensiRecords(selectedSession.value.id)
    }

    toast.add({
      title: 'Error update status',
      description: formatErrorMessage(error, 'Failed to update status'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Expose refresh method to parent
defineExpose({
  refresh: fetchPresensiSessions
})

// Watch kelasId changes
watch(() => props.kelasId, async (newId) => {
  if (newId) {
    await fetchPresensiSessions()
  }
}, { immediate: true })
</script>

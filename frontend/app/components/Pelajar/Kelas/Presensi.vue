<template>
  <div class="space-y-4">
    <!-- Code Entry Section -->
    <div class="p-4 bg-elevated border border-accented rounded-lg">
      <h3 class="text-lg font-semibold mb-4">Masukkan Kode Presensi</h3>
      <div class="flex gap-2">
        <UFormField class="flex-1" :error="validationError">
          <UInput v-model="presensiCode" placeholder="Masukkan 6 digit kode presensi" class="w-full font-mono"
            :disabled="isSubmitting" maxlength="6" />
        </UFormField>
        <UButton label="Submit" icon="i-lucide-check" :loading="isSubmitting" :disabled="!isCodeValid"
          @click="handleSubmitPresensi" />
      </div>
    </div>

    <!-- Presensi History -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Riwayat Presensi</h2>

      <!-- Summary Stats -->
      <div v-if="presensiHistory.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 border border-default rounded-lg">
          <p class="text-sm text-[--ui-text-muted] font-medium">Hadir</p>
          <p class="text-2xl font-bold">{{ presensiSummary.hadir }}</p>
        </div>
        <div class="p-4 border border-default rounded-lg">
          <p class="text-sm text-[--ui-text-muted] font-medium">Alfa</p>
          <p class="text-2xl font-bold">{{ presensiSummary.alfa }}</p>
        </div>
        <div class="p-4 border border-default rounded-lg">
          <p class="text-sm text-[--ui-text-muted] font-medium">Izin</p>
          <p class="text-2xl font-bold">{{ presensiSummary.izin }}</p>
        </div>
        <div class="p-4 border border-default rounded-lg">
          <p class="text-sm text-[--ui-text-muted] font-medium">Sakit</p>
          <p class="text-2xl font-bold">{{ presensiSummary.sakit }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingHistory" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="presensiHistory.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-calendar-check" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
        <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada riwayat presensi</p>
        <p class="text-sm text-[--ui-text-muted]">Presensi Anda akan muncul di sini</p>
      </div>

      <!-- Presensi Table -->
      <UTable v-else ref="historyTable" v-model:pagination="historyPagination" :data="presensiHistory"
        :columns="historyColumns" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="border border-accented rounded-lg overflow-hidden" />

      <!-- Pagination -->
      <div v-if="presensiHistory.length > 0" class="flex justify-end">
        <UPagination :page="(historyTable?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="historyTable?.tableApi?.getState().pagination.pageSize || 5"
          :total="historyTable?.tableApi?.getFilteredRowModel().rows.length || 0"
          @update:page="(p) => historyTable?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import type { PresensiRecord } from '~/composables/usePresensiApi'

const UBadge = resolveComponent('UBadge')

const props = defineProps<{
  kelasId: string
}>()

const toast = useToast()

// Composables
const { hadirDenganKode, getRiwayatPresensi } = usePresensiApi()

// State
const presensiCode = ref('')
const isSubmitting = ref(false)
const presensiHistory = ref<PresensiRecord[]>([])
const isLoadingHistory = ref(false)

const historyPagination = ref({
  pageIndex: 0,
  pageSize: 5
})
const historyTable = useTemplateRef('historyTable')

// Validation
const isCodeValid = computed(() => {
  const code = presensiCode.value.trim()
  return code.length === 6 && /^\d{6}$/.test(code)
})

const validationError = computed(() => {
  const code = presensiCode.value.trim()
  if (!code) return ''
  if (code.length !== 6) return 'Kode harus 6 digit'
  if (!/^\d+$/.test(code)) return 'Kode harus berupa angka'
  return ''
})

// Presensi summary
const presensiSummary = computed(() => {
  const summary = {
    hadir: 0,
    alfa: 0,
    izin: 0,
    sakit: 0
  }

  presensiHistory.value.forEach((record: PresensiRecord) => {
    switch (record.status) {
      case 'HADIR':
        summary.hadir++
        break
      case 'ALFA':
        summary.alfa++
        break
      case 'IZIN':
        summary.izin++
        break
      case 'SAKIT':
        summary.sakit++
        break
    }
  })

  return summary
})

// Submit presensi code
async function handleSubmitPresensi() {
  if (!isCodeValid.value) return

  try {
    isSubmitting.value = true
    const response = await hadirDenganKode({ kodePresensi: presensiCode.value.trim() })

    toast.add({
      title: 'Berhasil',
      description: response.message || 'Presensi berhasil dicatat',
      color: 'success'
    })

    // Clear input and refresh history
    presensiCode.value = ''
    await fetchPresensiHistory()
  } catch (error: any) {
    console.error('Error submitting presensi:', error)

    // Extract error message
    let errorMessage = 'Gagal mencatat presensi'
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        errorMessage = error.response.data.message.join(', ')
      } else {
        errorMessage = String(error.response.data.message)
      }
    } else if (error.message) {
      if (Array.isArray(error.message)) {
        errorMessage = error.message.join(', ')
      } else {
        errorMessage = String(error.message)
      }
    }

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Fetch presensi history
async function fetchPresensiHistory() {
  try {
    isLoadingHistory.value = true
    const response = await getRiwayatPresensi()

    // Note: getRiwayatPresensi returns presensi for current user
    // We'll show all records for now (backend should filter by user)
    presensiHistory.value = response.data || []
  } catch (error: any) {
    console.error('Error fetching presensi history:', error)
    presensiHistory.value = []
  } finally {
    isLoadingHistory.value = false
  }
}

// History table columns
const historyColumns: TableColumn<PresensiRecord>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string | undefined
      if (!createdAt) return h('div', { class: 'text-muted' }, '-')
      const date = new Date(createdAt)
      return h('div', { class: 'text-highlighted' }, date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Waktu',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string | undefined
      if (!createdAt) return h('div', { class: 'text-muted' }, '-')
      const date = new Date(createdAt)
      return h('div', { class: 'text-muted' }, date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      let color: string
      switch (status) {
        case 'HADIR':
          color = 'success'
          break
        case 'IZIN':
          color = 'info'
          break
        case 'SAKIT':
          color = 'warning'
          break
        case 'ALFA':
          color = 'error'
          break
        default:
          color = 'neutral'
      }
      return h(UBadge, { color, variant: 'subtle' }, () => status)
    }
  }
]

// Lifecycle
onMounted(() => {
  fetchPresensiHistory()
})

// Expose refresh method
defineExpose({
  refresh: fetchPresensiHistory
})
</script>

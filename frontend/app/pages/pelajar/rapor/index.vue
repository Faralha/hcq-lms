<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div>
      <h1 class="text-3xl font-bold">Rapor Saya</h1>
      <p class="text-[--ui-text-muted] mt-1">Lihat dan download rapor dari setiap semester</p>
    </div>

    <!-- Refresh Button -->
    <div class="flex justify-end">
      <UButton label="Refresh" icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="isLoadingRapor"
        @click="fetchMyRapor" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingRapor" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!myRaporFiles || myRaporFiles.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-file-x" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
      <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada rapor</p>
      <p class="text-sm text-[--ui-text-muted]">Rapor Anda akan muncul di sini setelah di-generate</p>
    </div>

    <!-- Rapor Tables Grouped by Semester -->
    <div v-else class="space-y-8">
      <div v-for="(group, semester) in raporGroupedBySemester" :key="semester" class="space-y-4">
        <!-- Semester Header -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
          <h2 class="text-xl font-semibold">{{ semester }}</h2>
        </div>

        <!-- Rapor Table for this semester -->
        <UTable :data="group.tableData" :columns="raporColumns"
          class="border border-accented rounded-lg overflow-x-auto">
          <template #empty>
            <div class="text-center py-8">
              <p class="text-sm text-[--ui-text-muted]">Tidak ada rapor untuk semester ini</p>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { RaporFile } from '~/composables/useRaporApi'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

definePageMeta({
  layout: 'menu',
  middleware: ['auth', 'pelajar']
})

const toast = useToast()

// Composables
const { getMyRaporFiles, downloadRapor, getRaporStatus } = useRaporApi()
const { getAllSemesters } = useSemesterApi()

// State
const isLoadingRapor = ref(false)
const myRaporFiles = ref<RaporFile[]>([])
const allSemesters = ref<any[]>([])

// Helper function to format error messages
function formatErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  if (Array.isArray(error.message)) {
    return error.message.join(', ')
  }
  if (error.response?.data?.message) {
    if (Array.isArray(error.response.data.message)) {
      return error.response.data.message.join(', ')
    }
    return error.response.data.message
  }
  return error.message || fallback
}

// Group rapor by semester
const raporGroupedBySemester = computed(() => {
  if (!myRaporFiles.value || myRaporFiles.value.length === 0) return {}

  const grouped: Record<string, { tableData: any[] }> = {}

  myRaporFiles.value.forEach((rapor: RaporFile) => {
    const semester = allSemesters.value.find(s => s.id === rapor.semesterId)
    const semesterName = semester?.nama || 'Semester Tidak Diketahui'

    if (!grouped[semesterName]) {
      grouped[semesterName] = { tableData: [] }
    }

    grouped[semesterName].tableData.push({
      id: rapor.id,
      semesterId: rapor.semesterId,
      status: rapor.status,
      fileUrl: rapor.fileUrl,
      createdAt: rapor.createdAt,
      updatedAt: rapor.updatedAt
    })
  })

  return grouped
})

// Generate columns for rapor table
const raporColumns = computed<TableColumn<any>[]>(() => {
  return [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        let color: string
        switch (status) {
          case 'COMPLETED':
            color = 'success'
            break
          case 'PROCESSING':
            color = 'info'
            break
          case 'PENDING':
            color = 'warning'
            break
          case 'FAILED':
            color = 'error'
            break
          default:
            color = 'neutral'
        }
        return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => status.toLowerCase())
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Dibuat',
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
      accessorKey: 'updatedAt',
      header: 'Terakhir Diupdate',
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'))
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
      header: 'Aksi',
      cell: ({ row }) => {
        const status = row.original.status
        const raporId = row.original.id

        if (status === 'COMPLETED') {
          return h('div', { class: 'flex gap-2' }, [
            h(UButton, {
              label: 'Download',
              icon: 'i-lucide-download',
              color: 'primary',
              variant: 'soft',
              size: 'sm',
              onClick: () => handleDownloadRapor(raporId)
            }),
            h(UButton, {
              icon: 'i-lucide-refresh-cw',
              color: 'neutral',
              variant: 'ghost',
              size: 'sm',
              onClick: () => handleRefreshStatus(raporId)
            })
          ])
        } else if (status === 'PENDING' || status === 'PROCESSING') {
          return h('div', { class: 'flex gap-2' }, [
            h(UButton, {
              label: 'Refresh Status',
              icon: 'i-lucide-refresh-cw',
              color: 'neutral',
              variant: 'ghost',
              size: 'sm',
              onClick: () => handleRefreshStatus(raporId)
            })
          ])
        } else if (status === 'FAILED') {
          return h('div', { class: 'flex gap-2' }, [
            h(UBadge, {
              color: 'error',
              variant: 'subtle'
            }, () => 'Gagal'),
            h(UButton, {
              icon: 'i-lucide-refresh-cw',
              color: 'neutral',
              variant: 'ghost',
              size: 'sm',
              onClick: () => handleRefreshStatus(raporId)
            })
          ])
        }

        return h('div', { class: 'text-muted' }, '-')
      }
    }
  ]
})

// Fetch my rapor files
async function fetchMyRapor() {
  try {
    isLoadingRapor.value = true

    const [raporRes, semestersRes] = await Promise.all([
      getMyRaporFiles(),
      getAllSemesters()
    ])

    console.log('[Rapor Pelajar] getMyRaporFiles response:', raporRes)
    console.log('[Rapor Pelajar] getAllSemesters response:', semestersRes)

    myRaporFiles.value = raporRes.data || []
    allSemesters.value = semestersRes.data || []
  } catch (error: any) {
    console.error('[Rapor Pelajar] Error fetching rapor:', error)
    toast.add({
      title: 'Error',
      description: formatErrorMessage(error, 'Gagal memuat data rapor'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    myRaporFiles.value = []
  } finally {
    isLoadingRapor.value = false
  }
}

// Handle download rapor
async function handleDownloadRapor(raporFileId: string) {
  try {
    toast.add({
      title: 'Downloading...',
      description: 'Menyiapkan file rapor',
      color: 'info',
      icon: 'i-lucide-download'
    })

    const url = await downloadRapor(raporFileId)

    const link = document.createElement('a')
    link.href = url
    link.download = `rapor_${raporFileId}.pdf`
    link.click()

    window.URL.revokeObjectURL(url)

    toast.add({
      title: 'Download berhasil',
      description: 'Rapor telah diunduh',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    console.error('[Rapor Pelajar] Error downloading:', error)
    toast.add({
      title: 'Error download rapor',
      description: formatErrorMessage(error, 'Gagal mengunduh rapor'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Handle refresh status
async function handleRefreshStatus(raporFileId: string) {
  try {
    const response = await getRaporStatus(raporFileId)
    console.log('[Rapor Pelajar] getRaporStatus response:', response)

    if (response.status === 200 && response.data) {
      // Update the specific rapor in the list
      const index = myRaporFiles.value.findIndex(r => r.id === raporFileId)
      if (index !== -1) {
        myRaporFiles.value[index] = response.data
      }

      toast.add({
        title: 'Status diupdate',
        description: `Status: ${response.data.status}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
  } catch (error: any) {
    console.error('[Rapor Pelajar] Error refreshing status:', error)
    toast.add({
      title: 'Error refresh status',
      description: formatErrorMessage(error, 'Gagal refresh status'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Lifecycle
onMounted(() => {
  fetchMyRapor()
})
</script>

<template>
  <div class="py-4 space-y-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold">Rapor Management</h1>
      <p class="text-lg font-medium text-[--ui-text-muted]">Generate dan kelola rapor pelajar</p>
    </div>

    <!-- Overview Stats -->
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Active Semester Card -->
        <UPageCard title="Semester Aktif" :description="stats.activeSemester || 'Tidak ada'"
          icon="i-lucide-calendar-check" variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Semester berjalan saat ini</p>
          </template>
        </UPageCard>

        <!-- Active Students Card -->
        <UPageCard title="Pelajar Aktif" :description="stats.activePelajar.toString()" icon="i-lucide-users"
          variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Pelajar di semester aktif</p>
          </template>
        </UPageCard>

        <!-- Active Classes Card -->
        <UPageCard title="Kelas Aktif" :description="stats.activeKelas.toString()" icon="i-lucide-school"
          variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Kelas di semester aktif</p>
          </template>
        </UPageCard>

        <!-- Generated Rapor Card -->
        <UPageCard title="Rapor Generated" :description="stats.generatedRapor.toString()" icon="i-lucide-file-check"
          variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Rapor yang telah dibuat</p>
          </template>
        </UPageCard>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3">
        <UButton label="Generate Semua Rapor" icon="i-lucide-file-text" color="primary" size="lg"
          :loading="isGeneratingAll" :disabled="!stats.activeSemesterId || stats.activePelajar === 0"
          @click="handleGenerateAllRapor" />
        <UButton label="Generate Rapor Spesifik" icon="i-lucide-user-plus" color="neutral" variant="outline" size="lg"
          :disabled="!stats.activeSemesterId" @click="openGenerateSpecificModal" />
        <UButton label="Refresh Data" icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="lg"
          :loading="isLoadingStats" @click="fetchStats" />
      </div>
    </div>

    <!-- Rapor Files Table -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Daftar Rapor</h2>

      <UTable ref="raporTable" v-model:pagination="raporPagination" :data="raporFiles" :columns="raporColumns"
        :loading="isLoadingRapor" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="border border-accented rounded-lg overflow-x-auto">
        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-lucide-file-x" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
            <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada rapor</p>
            <p class="text-sm text-[--ui-text-muted]">Generate rapor untuk mulai</p>
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
      <div v-if="raporFiles.length > 0" class="flex justify-end">
        <UPagination :page="(raporTable?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="raporTable?.tableApi?.getState().pagination.pageSize || 10"
          :total="raporTable?.tableApi?.getFilteredRowModel().rows.length || 0"
          @update:page="(p) => raporTable?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>

    <!-- Modal Generate Specific Rapor -->
    <UModal v-model:open="isGenerateModalOpen" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Generate Rapor Spesifik</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Semester" required class="w-full">
              <UInput :model-value="stats.activeSemester" disabled class="w-full" />
            </UFormField>

            <UFormField label="Pilih Pelajar" required class="w-full">
              <USelect v-model="selectedStudentId" :items="studentOptions" value-key="value" placeholder="Pilih pelajar"
                class="w-full" :loading="isLoadingStudents" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3 pt-4">
              <UButton class="w-full justify-center" label="Generate" icon="i-lucide-file-plus"
                :loading="isGeneratingSpecific" :disabled="!selectedStudentId" @click="handleGenerateSpecificRapor" />
              <UButton class="w-full justify-center" label="Batal" color="neutral" variant="outline"
                @click="isGenerateModalOpen = false" />
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
import type { RaporFile } from '~/composables/useRaporApi'
import type { User } from '~/types/entities'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

definePageMeta({
  middleware: 'auth',
  layout: 'menu',
  ssr: false,
})

const toast = useToast()

// Composables
const { getAllSemesters } = useSemesterApi()
const { getAllKelas } = useKelasApi()
const { getAllUsers } = useUserApi()
const { generateRapor, getAllRaporFiles, getRaporStatus, downloadRapor } = useRaporApi()

// State
const stats = ref({
  activeSemester: '',
  activeSemesterId: '',
  activePelajar: 0,
  activeKelas: 0,
  generatedRapor: 0
})

const raporFiles = ref<RaporFile[]>([])
const allUsers = ref<User[]>([])
const allSemesters = ref<any[]>([])
const isLoadingStats = ref(false)
const isLoadingRapor = ref(false)
const isGeneratingAll = ref(false)
const isGeneratingSpecific = ref(false)
const isGenerateModalOpen = ref(false)
const isLoadingStudents = ref(false)
const selectedStudentId = ref('')

const studentOptions = ref<Array<{ label: string; value: string }>>([])

const raporPagination = ref({
  pageIndex: 0,
  pageSize: 10
})
const raporTable = useTemplateRef('raporTable')

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

// Rapor table columns
const raporColumns: TableColumn<RaporFile>[] = [
  {
    accessorKey: 'studentId',
    header: 'Pelajar',
    cell: ({ row }) => {
      const studentId = row.getValue('studentId') as string
      const user = allUsers.value.find(u => u.id === studentId)
      if (!user) return h('div', { class: 'text-muted' }, 'Unknown')
      return h('div', { class: 'font-medium text-highlighted' }, user.nama)
    }
  },
  {
    accessorKey: 'semesterId',
    header: 'Semester',
    cell: ({ row }) => {
      const semesterId = row.getValue('semesterId') as string
      const semester = allSemesters.value.find(s => s.id === semesterId)
      if (!semester) return h('div', { class: 'text-muted' }, 'Unknown')
      return h('div', { class: 'text-highlighted' }, semester.nama)
    }
  },
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
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const status = row.original.status
      const items = []

      if (status === 'COMPLETED') {
        items.push({
          label: 'Download',
          icon: 'i-lucide-download',
          onSelect: () => handleDownloadRapor(row.original.id)
        })
      }

      items.push({
        label: 'Refresh Status',
        icon: 'i-lucide-refresh-cw',
        onSelect: () => handleRefreshStatus(row.original.id)
      })

      if (status === 'FAILED') {
        items.push({
          label: 'Retry Generate',
          icon: 'i-lucide-repeat',
          onSelect: () => handleRetryGenerate(row.original)
        })
      }

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
async function fetchStats() {
  isLoadingStats.value = true
  try {
    const [semestersRes, classesRes, usersRes, raporRes] = await Promise.all([
      getAllSemesters(),
      getAllKelas(),
      getAllUsers(),
      getAllRaporFiles()
    ])

    console.log('[Rapor] getAllSemesters response:', semestersRes)
    console.log('[Rapor] getAllKelas response:', classesRes)
    console.log('[Rapor] getAllUsers response:', usersRes)
    console.log('[Rapor] getAllRaporFiles response:', raporRes)

    const semesters = semestersRes.status === 200 && semestersRes.data ? semestersRes.data : []
    const classes = classesRes.status === 200 && classesRes.data ? classesRes.data : []
    const users = usersRes.status === 200 && usersRes.data ? usersRes.data : []
    const rapor = raporRes.status === 200 && raporRes.data ? raporRes.data : []

    // Store for lookup in table
    allUsers.value = users
    allSemesters.value = semesters

    const activeSemester = semesters.find(s => s.status === 'AKTIF')
    const activeKelas = activeSemester ? classes.filter(k => k.semesterId === activeSemester.id) : []

    // Get unique pelajar from active classes
    const uniquePelajarIds = new Set<string>()
    activeKelas.forEach(kelas => {
      if (kelas.enrollments) {
        kelas.enrollments.forEach(enrollment => {
          if (enrollment.user?.role === 'PELAJAR') {
            uniquePelajarIds.add(enrollment.userId)
          }
        })
      }
    })

    stats.value = {
      activeSemester: activeSemester?.nama || 'Tidak ada',
      activeSemesterId: activeSemester?.id || '',
      activePelajar: uniquePelajarIds.size,
      activeKelas: activeKelas.length,
      generatedRapor: rapor.filter(r => r.status === 'COMPLETED').length
    }

    raporFiles.value = rapor
  } catch (error: any) {
    console.error('[Rapor] Error fetching stats:', error)
    toast.add({
      title: 'Error loading data',
      description: formatErrorMessage(error, 'Failed to fetch rapor data'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoadingStats.value = false
  }
}

async function fetchStudentList() {
  isLoadingStudents.value = true
  try {
    const usersRes = await getAllUsers()
    console.log('[Rapor] fetchStudentList - getAllUsers response:', usersRes)
    const users = usersRes.status === 200 && usersRes.data ? usersRes.data : []

    // Filter only pelajar
    const pelajarList = users.filter((u: User) => u.role === 'PELAJAR')

    studentOptions.value = pelajarList.map((u: User) => ({
      label: `${u.nama} (${u.email})`,
      value: u.id
    }))
  } catch (error: any) {
    console.error('[Rapor] Error fetching students:', error)
    toast.add({
      title: 'Error loading students',
      description: formatErrorMessage(error, 'Failed to fetch student list'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoadingStudents.value = false
  }
}

async function handleGenerateAllRapor() {
  if (!stats.value.activeSemesterId) {
    toast.add({
      title: 'Error',
      description: 'Tidak ada semester aktif',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isGeneratingAll.value = true
  try {
    // Get all pelajar
    const usersRes = await getAllUsers()
    console.log('[Rapor] handleGenerateAllRapor - getAllUsers response:', usersRes)
    const users = usersRes.status === 200 && usersRes.data ? usersRes.data : []
    const pelajarList = users.filter((u: User) => u.role === 'PELAJAR')

    if (pelajarList.length === 0) {
      toast.add({
        title: 'Informasi',
        description: 'Tidak ada pelajar untuk di-generate',
        color: 'info',
        icon: 'i-lucide-info'
      })
      return
    }

    // Generate rapor for each pelajar
    let successCount = 0
    let errorCount = 0

    for (const pelajar of pelajarList) {
      try {
        const generateRes = await generateRapor(pelajar.id, stats.value.activeSemesterId)
        console.log(`[Rapor] generateRapor for ${pelajar.nama}:`, generateRes)
        successCount++
      } catch (error: any) {
        console.error(`[Rapor] Error generating for ${pelajar.nama}:`, error)
        errorCount++
      }
    }

    toast.add({
      title: 'Generate rapor selesai',
      description: `Berhasil: ${successCount}, Gagal: ${errorCount}`,
      color: successCount > 0 ? 'success' : 'error',
      icon: 'i-lucide-check-circle'
    })

    await fetchStats()
  } catch (error: any) {
    console.error('[Rapor] Error generating all rapor:', error)
    toast.add({
      title: 'Error generate rapor',
      description: formatErrorMessage(error, 'Failed to generate rapor'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isGeneratingAll.value = false
  }
}

function openGenerateSpecificModal() {
  if (!stats.value.activeSemesterId) {
    toast.add({
      title: 'Error',
      description: 'Tidak ada semester aktif',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  selectedStudentId.value = ''
  fetchStudentList()
  isGenerateModalOpen.value = true
}

async function handleGenerateSpecificRapor() {
  if (!selectedStudentId.value || !stats.value.activeSemesterId) {
    toast.add({
      title: 'Validasi error',
      description: 'Pilih pelajar terlebih dahulu',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isGeneratingSpecific.value = true
  try {
    const response = await generateRapor(selectedStudentId.value, stats.value.activeSemesterId)
    console.log('[Rapor] handleGenerateSpecificRapor - generateRapor response:', response)

    if (response.status == 200) {
      toast.add({
        title: 'Rapor berhasil di-generate',
        description: response.data?.message || 'Rapor sedang diproses',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isGenerateModalOpen.value = false
      await fetchStats()
    }
  } catch (error: any) {
    console.error('[Rapor] Error generating specific rapor:', error)
    toast.add({
      title: 'Error generate rapor',
      description: formatErrorMessage(error, 'Failed to generate rapor'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isGeneratingSpecific.value = false
  }
}

async function handleDownloadRapor(raporFileId: string) {
  try {
    toast.add({
      title: 'Downloading...',
      description: 'Preparing rapor file',
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
    console.error('[Rapor] Error downloading:', error)
    toast.add({
      title: 'Error download rapor',
      description: formatErrorMessage(error, 'Failed to download rapor'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleRefreshStatus(raporFileId: string) {
  try {
    const response = await getRaporStatus(raporFileId)
    console.log('[Rapor] handleRefreshStatus - getRaporStatus response:', response)

    if (response.status === 200) {
      // Update the specific rapor in the list
      const index = raporFiles.value.findIndex(r => r.id === raporFileId)
      if (index !== -1 && response.data) {
        raporFiles.value[index] = response.data
      }

      toast.add({
        title: 'Status updated',
        description: `Status: ${response.data?.status || 'Unknown'}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
  } catch (error: any) {
    console.error('[Rapor] Error refreshing status:', error)
    toast.add({
      title: 'Error refresh status',
      description: formatErrorMessage(error, 'Failed to refresh status'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleRetryGenerate(rapor: RaporFile) {
  if (!rapor.studentId || !rapor.semesterId) {
    toast.add({
      title: 'Error',
      description: 'Data rapor tidak lengkap',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  try {
    const response = await generateRapor(rapor.studentId, rapor.semesterId)
    console.log('[Rapor] handleRetryGenerate - generateRapor response:', response)

    if (response.status === 200) {
      toast.add({
        title: 'Retry berhasil',
        description: 'Rapor sedang diproses ulang',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      await fetchStats()
    }
  } catch (error: any) {
    console.error('[Rapor] Error retrying generate:', error)
    toast.add({
      title: 'Error retry generate',
      description: formatErrorMessage(error, 'Failed to retry generation'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Fetch data on mount
onMounted(() => {
  fetchStats()
})
</script>

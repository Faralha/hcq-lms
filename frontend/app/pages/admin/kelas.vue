<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Atur Kelas & Enrollment</h1>
    </div>

    <!-- Tambah Kelas Modal -->
    <UModal v-model:open="isModalOpen">
      <UButton label="Tambah Kelas" icon="i-lucide-school" />

      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">{{ isEditing ? 'Edit' : 'Tambah' }} Kelas</h3>
          </template>

          <UForm :state="form" @submit="onSubmit" class="space-y-4">
            <UFormField label="Nama Kelas" name="namaKelas" required>
              <UInput class="w-full" v-model="form.namaKelas" placeholder="Kelas A - Tahfidz" />
            </UFormField>

            <UFormField label="Semester" name="semesterId" required>
              <USelect class="w-full" v-model="form.semesterId" :items="semesterOptions" placeholder="Pilih Semester" />
            </UFormField>

            <UFormField label="Mata Pelajaran" name="mataPelajaranId" required>
              <USelect class="w-full" v-model="form.mataPelajaranId" :items="mataPelajaranOptions"
                placeholder="Pilih Mata Pelajaran" />
            </UFormField>

            <UFormField label="Jadwal Hari" name="jadwalHari" required>
              <UInput class="w-full" v-model="form.jadwalHari" placeholder="Senin, Rabu" />
            </UFormField>

            <UFormField label="Jadwal Jam" name="jadwalJam" required>
              <UInput class="w-full" v-model="form.jadwalJam" placeholder="08:00 - 10:00" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3">
              <UButton class="w-full justify-center" type="submit" :loading="isSubmitting">
                {{ isEditing ? 'Update' : 'Tambah' }}
              </UButton>
              <UButton class="w-full justify-center" color="error" variant="outline" @click="closeModal">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <!-- Enrollment Modal -->
    <UModal v-model:open="isEnrollModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Kelola Enrollment - {{ selectedKelas?.namaKelas }}</h3>
          </template>

          <div class="space-y-4">
            <!-- Add Pelajar -->
            <div>
              <UFormField label="Atur Pelajar" name="pelajarId">
                <div class="flex flex-col gap-2">
                  <USelect v-model="enrollPelajarForm.pelajarId" :items="pelajarOptions" placeholder="Pilih Pelajar"
                    class="flex-1" />
                  <UButton class="justify-center" @click="handleEnroll('PELAJAR')" :loading="isEnrolling">
                    Tambah
                  </UButton>
                </div>
              </UFormField>
            </div>

            <!-- Add Pengajar -->
            <div>
              <UFormField label="Atur Pengajar" name="pengajarId">
                <div class="flex flex-col gap-2">
                  <USelect v-model="enrollPengajarForm.pengajarId" :items="pengajarOptions" placeholder="Pilih Pengajar"
                    class="flex-1" />
                  <UButton class="justify-center" @click="handleEnroll('PENGAJAR')" :loading="isEnrolling">
                    Tambah
                  </UButton>
                </div>
              </UFormField>
            </div>

            <!-- Current Enrollments -->
            <div v-if="selectedKelas">
              <h4 class="font-semibold mb-2">Enrolled Users</h4>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                <div v-for="enrollment in selectedKelas.enrollments" :key="enrollment.user.id"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div class="flex items-center gap-2">
                    <UAvatar :text="enrollment.user.nama.charAt(0)" size="sm" />
                    <div>
                      <p class="font-medium text-sm">{{ enrollment.user.nama }}</p>
                      <p class="text-xs text-[--ui-text-muted]">{{ enrollment.user.role }}</p>
                    </div>
                  </div>
                  <UButton icon="i-lucide-x" color="error" variant="ghost" size="xs"
                    @click="handleUnenroll(enrollment.user.id)" />
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <UButton color="neutral" variant="outline" @click="closeEnrollModal">
                Tutup
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Tableview -->
    <div class="flex flex-col flex-1 w-full border border-accented rounded-lg overflow-hidden">
      <!-- Filter & Actions Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-accented">
        <UInput v-model="namaFilter" class="max-w-sm min-w-[12ch]" placeholder="Filter by name..."
          icon="i-lucide-search">
          <template #trailing>
            <UButton v-show="namaFilter !== ''" color="neutral" variant="link" icon="i-lucide-x" :padded="false"
              @click="namaFilter = ''" />
          </template>
        </UInput>
      </div>

      <!-- Table -->
      <UTable ref="table" :data="kelasList" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted]">
        {{ filteredCount }} kelas ditemukan
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false,
})

import type { Kelas as KelasType } from '~/composables/useKelasApi'
import type { User } from '~/composables/useUserApi'
import type { Semester } from '~/composables/useSemesterApi'
import type { MataPelajaran } from '~/composables/useMataPelajaranApi'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const { getAllKelas, createKelas, updateKelas, deleteKelas, enrollPelajar, assignPengajar, unenrollUser } = useKelasApi()
const { getAllSemesters } = useSemesterApi()
const { getAllMataPelajaran } = useMataPelajaranApi()
const { getAllUsers } = useUserApi()

// State
const kelasList = ref<KelasType[]>([])
const semesters = ref<Semester[]>([])
const mataPelajaranList = ref<MataPelajaran[]>([])
const users = ref<User[]>([])
const isLoading = ref(false)
const namaFilter = ref('')
const table = useTemplateRef('table')
const isModalOpen = ref(false)
const isEnrollModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const isEnrolling = ref(false)
const selectedKelas = ref<Kelas | null>(null)

const form = ref({
  id: '',
  namaKelas: '',
  semesterId: '',
  mataPelajaranId: '',
  jadwalHari: '',
  jadwalJam: ''
})

const enrollPelajarForm = ref({
  pelajarId: ''
})

const enrollPengajarForm = ref({
  pengajarId: ''
})

// Computed
const filteredCount = computed(() => {
  if (!namaFilter.value) return kelasList.value.length
  return kelasList.value.filter(k =>
    k.namaKelas.toLowerCase().includes(namaFilter.value.toLowerCase())
  ).length
})

const semesterOptions = computed(() =>
  semesters.value.map(s => ({ label: s.nama, value: s.id }))
)

const mataPelajaranOptions = computed(() =>
  mataPelajaranList.value.map(mp => ({ label: `${mp.kode} - ${mp.nama}`, value: mp.id }))
)

const pelajarOptions = computed(() =>
  users.value
    .filter(u => u.role === 'PELAJAR')
    .map(u => ({ label: u.nama, value: u.id }))
)

const pengajarOptions = computed(() =>
  users.value
    .filter(u => u.role === 'PENGAJAR')
    .map(u => ({ label: u.nama, value: u.id }))
)

// Table Columns
const columns: TableColumn<KelasType>[] = [
  {
    accessorKey: 'namaKelas',
    header: 'Nama Kelas',
    cell: ({ row }) => {
      return h('p', { class: 'font-medium text-[--ui-text-highlighted]' }, row.getValue('namaKelas'))
    }
  },
  {
    accessorKey: 'mataPelajaran',
    header: 'Mata Pelajaran',
    cell: ({ row }) => {
      const mp = row.original.mataPelajaran
      return mp ? h('span', { class: 'font-mono text-sm' }, `${mp.kode} - ${mp.nama}`) : '-'
    }
  },
  {
    accessorKey: 'semester',
    header: 'Semester',
    cell: ({ row }) => {
      const semester = row.original.semester
      return semester ? semester.nama : '-'
    }
  },
  {
    accessorKey: 'jadwalHari',
    header: 'Jadwal',
    cell: ({ row }) => {
      const hari = row.getValue('jadwalHari') as string
      const jam = row.original.jadwalJam
      return hari ? `${hari}, ${jam}` : '-'
    }
  },
  {
    accessorKey: 'enrollments',
    header: 'Enrolled',
    cell: ({ row }) => {
      const enrollments = row.original.enrollments || []
      const pelajarCount = enrollments.filter(e => e.user.role === 'PELAJAR').length
      const pengajarCount = enrollments.filter(e => e.user.role === 'PENGAJAR').length

      return h('div', { class: 'flex gap-2' }, [
        h(UBadge, { variant: 'subtle', color: 'primary' }, () => `${pelajarCount} Pelajar`),
        h(UBadge, { variant: 'subtle', color: 'success' }, () => `${pengajarCount} Pengajar`)
      ])
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const items = [
        {
          type: 'label' as const,
          label: 'Actions'
        },
        {
          label: 'Kelola Enrollment',
          icon: 'i-lucide-users',
          onSelect: () => openEnrollModal(row.original)
        },
        {
          label: 'Edit Kelas',
          icon: 'i-lucide-edit',
          onSelect: () => handleEdit(row.original)
        },
        {
          type: 'separator' as const
        },
        {
          label: 'Delete Kelas',
          icon: 'i-lucide-trash',
          color: 'error' as const,
          onSelect: () => handleDelete(row.original)
        }
      ]

      return h('div', { class: 'text-right' }, h(UDropdownMenu, {
        'content': { align: 'end' },
        items,
        'aria-label': 'Actions dropdown'
      }, () => h(UButton, {
        'icon': 'i-lucide-ellipsis-vertical',
        'color': 'neutral',
        'variant': 'ghost',
        'class': 'ml-auto',
        'aria-label': 'Actions dropdown'
      })))
    }
  }
]

// Methods
async function fetchKelas() {
  isLoading.value = true
  try {
    const response = await getAllKelas()
    kelasList.value = response
  } catch (error: any) {
    console.error('[KELAS] Error:', error)
    toast.add({
      title: 'Error loading kelas',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

async function fetchSemesters() {
  try {
    const response = await getAllSemesters()
    semesters.value = response
    console.log('[SEMESTERS] Fetched:', response)
    console.log('[SEMESTERS] Options:', semesterOptions.value)
  } catch (error) {
    console.error('[SEMESTERS] Error:', error)
  }
}

async function fetchMataPelajaran() {
  try {
    const response = await getAllMataPelajaran()
    mataPelajaranList.value = response
  } catch (error) {
    console.error('[MATA PELAJARAN] Error:', error)
  }
}

async function fetchUsers() {
  try {
    const response = await getAllUsers()
    users.value = response
  } catch (error) {
    console.error('[USERS] Error:', error)
  }
}

function openCreateModal() {
  isEditing.value = false
  form.value = {
    id: '',
    namaKelas: '',
    semesterId: '',
    mataPelajaranId: '',
    jadwalHari: '',
    jadwalJam: ''
  }
  isModalOpen.value = true
}

function handleEdit(kelas: KelasType) {
  isEditing.value = true
  form.value = {
    id: kelas.id,
    namaKelas: kelas.namaKelas,
    semesterId: kelas.semesterId,
    mataPelajaranId: kelas.mataPelajaranId,
    jadwalHari: kelas.jadwalHari,
    jadwalJam: kelas.jadwalJam
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function openEnrollModal(kelas: Kelas) {
  selectedKelas.value = kelas
  enrollPelajarForm.value.pelajarId = ''
  enrollPengajarForm.value.pengajarId = ''
  isEnrollModalOpen.value = true
}

function closeEnrollModal() {
  isEnrollModalOpen.value = false
  selectedKelas.value = null
}

async function onSubmit() {
  isSubmitting.value = true
  try {
    const payload = {
      namaKelas: form.value.namaKelas,
      semesterId: form.value.semesterId,
      mataPelajaranId: form.value.mataPelajaranId,
      jadwalHari: form.value.jadwalHari,
      jadwalJam: form.value.jadwalJam
    }

    console.log('Submitting kelas with payload:', payload)

    if (isEditing.value) {
      await updateKelas(form.value.id, payload)
    } else {
      await createKelas(payload)
    }

    toast.add({
      title: `Kelas ${isEditing.value ? 'updated' : 'created'} successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    closeModal()
    await fetchKelas()
  } catch (error: any) {
    toast.add({
      title: `Error ${isEditing.value ? 'updating' : 'creating'} kelas`,
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleEnroll(type: 'PELAJAR' | 'PENGAJAR') {
  const userId = type === 'PELAJAR' ? enrollPelajarForm.value.pelajarId : enrollPengajarForm.value.pengajarId

  if (!userId || !selectedKelas.value) return

  isEnrolling.value = true
  try {
    if (type === 'PELAJAR') {
      await enrollPelajar(selectedKelas.value.id, { pelajarId: userId })
    } else {
      await assignPengajar(selectedKelas.value.id, { pengajarId: userId })
    }

    toast.add({
      title: `${type} enrolled successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    // Clear form
    if (type === 'PELAJAR') {
      enrollPelajarForm.value.pelajarId = ''
    } else {
      enrollPengajarForm.value.pengajarId = ''
    }

    await fetchKelas()

    // Refresh selected kelas
    const updated = kelasList.value.find(k => k.id === selectedKelas.value?.id)
    if (updated) selectedKelas.value = updated
  } catch (error: any) {
    toast.add({
      title: 'Error enrolling user',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isEnrolling.value = false
  }
}

async function handleUnenroll(userId: string) {
  if (!selectedKelas.value) return

  const confirmed = confirm('Yakin ingin menghapus user dari kelas ini?')
  if (!confirmed) return

  try {
    await unenrollUser(selectedKelas.value.id, userId)

    toast.add({
      title: 'User unenrolled successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await fetchKelas()

    // Refresh selected kelas
    const updated = kelasList.value.find(k => k.id === selectedKelas.value?.id)
    if (updated) selectedKelas.value = updated
  } catch (error: any) {
    toast.add({
      title: 'Error unenrolling user',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDelete(kelas: KelasType) {
  const confirmed = confirm(`Yakin ingin menghapus kelas ${kelas.namaKelas}?`)
  if (!confirmed) return

  try {
    await deleteKelas(kelas.id)

    toast.add({
      title: 'Kelas deleted successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    kelasList.value = kelasList.value.filter(k => k.id !== kelas.id)
  } catch (error: any) {
    toast.add({
      title: 'Error deleting kelas',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Watch nama filter
watch(namaFilter, (value) => {
  table.value?.tableApi?.getColumn('nama')?.setFilterValue(value)
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchKelas(),
    fetchSemesters(),
    fetchMataPelajaran(),
    fetchUsers()
  ])
})
</script>

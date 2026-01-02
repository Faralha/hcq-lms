<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Keuangan</p>
      <h1 class="text-3xl font-bold">Manajemen SPP Murid</h1>
    </div>

    <!-- Tambah Tagihan Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">{{ isEditing ? 'Edit' : 'Tambah' }} Tagihan SPP</h3>
          </template>

          <UForm :schema="schema" :state="form" @submit="onSubmit" class="space-y-4">
            <UFormField label="Pelajar" name="userId" required>
              <USelect class="w-full" v-model="form.userId" :items="pelajarOptions" placeholder="Pilih Pelajar"
                :disabled="isEditing" />
            </UFormField>

            <UFormField label="Bulan" name="bulan" required>
              <USelect class="w-full" v-model="form.bulan" :items="bulanOptions" placeholder="Pilih Bulan" />
            </UFormField>

            <UFormField label="Tahun" name="tahun" required>
              <UInput class="w-full" v-model.number="form.tahun" type="number" placeholder="2025" />
            </UFormField>

            <UFormField label="Nominal (Rp)" name="nominal" required>
              <UInput class="w-full" v-model.number="form.nominal" type="number" placeholder="500000" />
            </UFormField>

            <UFormField label="Status" name="status" required>
              <USelect class="w-full" v-model="form.status" :items="statusOptions" />
            </UFormField>

            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="outline" @click="closeModal">
                Batal
              </UButton>
              <UButton type="submit" :loading="isSubmitting">
                {{ isEditing ? 'Update' : 'Tambah' }}
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <div class="flex gap-3">
      <UButton label="Tambah Tagihan SPP" icon="i-lucide-wallet" @click="openCreateModal" />
      <UButton label="Generate Tagihan Massal" icon="i-lucide-file-spreadsheet" color="secondary" variant="outline"
        @click="handleBulkGenerate" />
    </div>

    <!-- Tableview -->
    <div class="flex flex-col flex-1 w-full border border-accented rounded-lg overflow-hidden">
      <!-- Filter & Actions Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-accented">
        <UInput v-model="namaFilter" class="max-w-sm min-w-[12ch]" placeholder="Filter by nama..."
          icon="i-lucide-search">
          <template #trailing>
            <UButton v-show="namaFilter !== ''" color="neutral" variant="link" icon="i-lucide-x" :padded="false"
              @click="namaFilter = ''" />
          </template>
        </UInput>

        <USelect v-model="statusFilter" :options="[
          { label: 'Semua Status', value: '' },
          { label: 'Belum Lunas', value: 'BELUM_LUNAS' },
          { label: 'Lunas', value: 'LUNAS' }
        ]" class="w-40" />
      </div>

      <!-- Table -->
      <UTable ref="table" :data="filteredSpp" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted] flex justify-between">
        <span>{{ filteredSpp.length }} tagihan ditemukan</span>
        <span class="font-semibold">Total Belum Lunas: {{ formatCurrency(totalBelumLunas) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import * as z from 'zod'
import type { TableColumn } from '@nuxt/ui'
import type { Spp } from '~/composables/useSppApi'

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false,
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const { getAllSpp, createSpp, updateSpp, deleteSpp } = useSppApi()
const { getAllUsers } = useUserApi()

// State
const sppList = ref<Spp[]>([])
const pelajarList = ref<Array<{ id: string; nama: string; email: string }>>([])
const isLoading = ref(false)
const namaFilter = ref('')
const statusFilter = ref('')
const table = useTemplateRef('table')
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

const schema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'Pelajar wajib dipilih'),
  bulan: z.string().min(1, 'Bulan wajib dipilih'),
  tahun: z.number().min(2000, 'Tahun tidak valid'),
  nominal: z.number().min(1, 'Nominal harus lebih dari 0'),
  status: z.enum(['BELUM_LUNAS', 'LUNAS'])
})

type SppSchema = z.output<typeof schema>

const form = reactive<Partial<SppSchema>>({
  id: '',
  userId: '',
  bulan: '',
  tahun: new Date().getFullYear(),
  nominal: 500000,
  status: 'BELUM_LUNAS' as 'BELUM_LUNAS' | 'LUNAS'
})

const bulanOptions = [
  { label: 'Januari', value: 'Januari' },
  { label: 'Februari', value: 'Februari' },
  { label: 'Maret', value: 'Maret' },
  { label: 'April', value: 'April' },
  { label: 'Mei', value: 'Mei' },
  { label: 'Juni', value: 'Juni' },
  { label: 'Juli', value: 'Juli' },
  { label: 'Agustus', value: 'Agustus' },
  { label: 'September', value: 'September' },
  { label: 'Oktober', value: 'Oktober' },
  { label: 'November', value: 'November' },
  { label: 'Desember', value: 'Desember' }
]

const statusOptions = [
  { label: 'Belum Lunas', value: 'BELUM_LUNAS' },
  { label: 'Lunas', value: 'LUNAS' }
]

// Computed
const pelajarOptions = computed(() =>
  pelajarList.value.map(p => ({ label: `${p.nama} (${p.email})`, value: p.id }))
)

const filteredSpp = computed(() => {
  let filtered = sppList.value

  if (namaFilter.value) {
    filtered = filtered.filter(spp =>
      spp.user?.nama.toLowerCase().includes(namaFilter.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(spp => spp.status === statusFilter.value)
  }

  return filtered
})

const totalBelumLunas = computed(() => {
  return filteredSpp.value
    .filter(spp => spp.status === 'BELUM_LUNAS')
    .reduce((sum, spp) => sum + spp.nominal, 0)
})

// Table Columns
const columns: TableColumn<Spp>[] = [
  {
    accessorKey: 'user',
    header: 'Nama Pelajar',
    cell: ({ row }) => {
      const user = row.original.user
      return user ? h('div', [
        h('p', { class: 'font-medium' }, user.nama),
        h('p', { class: 'text-xs text-[--ui-text-muted]' }, user.email)
      ]) : '-'
    }
  },
  {
    accessorKey: 'bulan',
    header: 'Periode',
    cell: ({ row }) => {
      return `${row.getValue('bulan')} ${row.original.tahun}`
    }
  },
  {
    accessorKey: 'nominal',
    header: 'Nominal',
    cell: ({ row }) => {
      return h('span', { class: 'font-mono' }, formatCurrency(row.getValue('nominal')))
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = status === 'LUNAS' ? 'success' : 'warning'

      return h(UBadge, {
        variant: 'subtle',
        color
      }, () => status === 'LUNAS' ? 'Lunas' : 'Belum Lunas')
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
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
          label: 'Edit Tagihan',
          icon: 'i-lucide-edit',
          onSelect: () => handleEdit(row.original)
        },
        {
          label: row.original.status === 'BELUM_LUNAS' ? 'Tandai Lunas' : 'Tandai Belum Lunas',
          icon: 'i-lucide-check-circle',
          onSelect: () => toggleStatus(row.original)
        },
        {
          type: 'separator' as const
        },
        {
          label: 'Delete Tagihan',
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
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

async function fetchSpp() {
  isLoading.value = true
  try {
    const response = await getAllSpp()
    if (response.status === 200 && response.data) {
      sppList.value = response.data
    }
  } catch (error: any) {
    console.error('[SPP] Error:', error)
    toast.add({
      title: 'Error loading SPP',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

async function fetchPelajar() {
  try {
    const response = await getAllUsers()
    if (response.status === 200 && response.data) {
      const users = response.data
      pelajarList.value = users.filter((u: any) => u.role === 'PELAJAR')
    }
  } catch (error) {
    console.error('[PELAJAR] Error:', error)
  }
}

function openCreateModal() {
  isEditing.value = false
  const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long' })
  form.bulan = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)
  form.tahun = new Date().getFullYear()
  form.nominal = 500000
  form.userId = ''
  form.status = 'BELUM_LUNAS'
  isModalOpen.value = true
}

function handleEdit(spp: Spp) {
  isEditing.value = true
  form.id = spp.id
  form.userId = spp.userId
  form.bulan = spp.bulan
  form.tahun = spp.tahun
  form.nominal = spp.nominal
  form.status = spp.status
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  form.id = ''
  form.userId = ''
  form.bulan = ''
  form.tahun = new Date().getFullYear()
  form.nominal = 500000
  form.status = 'BELUM_LUNAS'
}

async function onSubmit() {
  isSubmitting.value = true
  try {
    const payload = {
      userId: form.userId || '',
      bulan: form.bulan || '',
      tahun: form.tahun || new Date().getFullYear(),
      nominal: form.nominal || 0,
      status: form.status as 'BELUM_LUNAS' | 'LUNAS'
    }

    let response
    if (isEditing.value) {
      response = await updateSpp(form.id || '', {
        nominal: payload.nominal,
        status: payload.status
      })
    } else {
      response = await createSpp(payload)
    }

    if (response.status !== 200 && response.status !== 201) throw new Error('Failed to save tagihan')

    toast.add({
      title: `Tagihan SPP ${isEditing.value ? 'updated' : 'created'} successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    closeModal()
    await fetchSpp()
  } catch (error: any) {
    toast.add({
      title: `Error ${isEditing.value ? 'updating' : 'creating'} tagihan`,
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function toggleStatus(spp: Spp) {
  try {
    const newStatus = spp.status === 'LUNAS' ? 'BELUM_LUNAS' : 'LUNAS'
    const response = await updateSpp(spp.id, { status: newStatus })

    if (response.status !== 200) throw new Error('Failed to update status')

    toast.add({
      title: 'Status updated successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await fetchSpp()
  } catch (error: any) {
    toast.add({
      title: 'Error updating status',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDelete(spp: Spp) {
  const confirmed = confirm('Yakin ingin menghapus tagihan SPP ini?')
  if (!confirmed) return

  try {
    const response = await deleteSpp(spp.id)
    if (response.status !== 200) throw new Error('Failed to delete tagihan')

    toast.add({
      title: 'Tagihan SPP deleted successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    sppList.value = sppList.value.filter(s => s.id !== spp.id)
  } catch (error: any) {
    toast.add({
      title: 'Error deleting tagihan',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

function handleBulkGenerate() {
  toast.add({
    title: 'Bulk Generate',
    description: 'Feature coming soon - akan generate tagihan untuk semua pelajar aktif',
    color: 'info',
    icon: 'i-lucide-info'
  })
}

// Watch filter
watch(namaFilter, (value) => {
  table.value?.tableApi?.getColumn('user')?.setFilterValue(value)
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchSpp(),
    fetchPelajar()
  ])
})
</script>

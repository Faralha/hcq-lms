<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">Tagihan SPP</h1>
      <p class="text-[--ui-text-muted] mt-1">Lihat tagihan SPP Anda</p>
    </div>

    <!-- Tableview -->
    <div class="flex flex-col flex-1 w-full border border-accented rounded-lg overflow-hidden">
      <!-- Filter Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-accented">
        <div class="text-sm font-medium text-[--ui-text-muted]">Daftar Tagihan SPP</div>

        <USelect v-model="statusFilter" :items="statusOptions" value-key="value" placeholder="Filter Status"
          class="w-40" />
      </div>

      <!-- Table -->
      <UTable ref="table" :data="filteredSpp" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1">
        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-lucide-receipt" class="w-16 h-16 mx-auto mb-4 text-[--ui-text-muted]" />
            <p class="text-lg font-medium text-[--ui-text-muted]">Belum ada tagihan SPP</p>
            <p class="text-sm text-[--ui-text-muted]">Tagihan SPP Anda akan muncul di sini</p>
          </div>
        </template>
      </UTable>

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
import type { TableColumn } from '@nuxt/ui'
import type { Spp } from '~/composables/useSppApi'

definePageMeta({
  layout: 'menu',
  middleware: ['auth', 'pelajar']
})

const UBadge = resolveComponent('UBadge')

const toast = useToast()
const { getMySpp } = useSppApi()

// State
const sppList = ref<Spp[]>([])
const isLoading = ref(false)
const statusFilter = ref('')
const table = useTemplateRef('table')

// Status options for filter
const statusOptions = [
  { label: 'Belum Lunas', value: 'BELUM_LUNAS' },
  { label: 'Lunas', value: 'LUNAS' }
]

// Computed
const filteredSpp = computed(() => {
  let filtered = sppList.value

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
    accessorKey: 'bulan',
    header: 'Periode',
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, `${row.getValue('bulan')} ${row.original.tahun}`)
    }
  },
  {
    accessorKey: 'nominal',
    header: 'Nominal',
    cell: ({ row }) => {
      return h('span', { class: 'font-mono font-semibold' }, formatCurrency(row.getValue('nominal')))
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
    header: 'Tanggal Dibuat',
    cell: ({ row }) => {
      return h('div', { class: 'text-muted' }, new Date(row.getValue('createdAt')).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }))
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

async function fetchMySpp() {
  isLoading.value = true
  try {
    const response = await getMySpp()
    if (response.status === 200 && response.data) {
      sppList.value = response.data
    }
  } catch (error: any) {
    console.error('[SPP] Error:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data tagihan SPP',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Load data on mount
onMounted(() => {
  fetchMySpp()
})
</script>

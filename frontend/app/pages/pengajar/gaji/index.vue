<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Gaji } from '~/composables/useGajiApi'

definePageMeta({
  layout: 'menu',
  middleware: ['auth', 'pengajar'],
  ssr: false
})

const UBadge = resolveComponent('UBadge')

// API Composable
const { getMyGaji } = useGajiApi()

// State
const loading = ref(true)
const gajiList = ref<Gaji[]>([])

// Table columns
const columns: TableColumn<Gaji>[] = [
  {
    accessorKey: 'no',
    header: 'No',
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.index + 1),
    meta: {
      class: {
        td: 'w-16'
      }
    }
  },
  {
    accessorKey: 'bulan',
    header: 'Bulan',
    cell: ({ row }) => {
      const bulanNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const bulanIndex = parseInt(row.getValue('bulan')) - 1
      return h('div', { class: 'text-highlighted' }, bulanNames[bulanIndex] || row.getValue('bulan'))
    }
  },
  {
    accessorKey: 'tahun',
    header: 'Tahun',
    cell: ({ row }) => h('div', { class: 'text-highlighted' }, row.getValue('tahun'))
  },
  {
    accessorKey: 'nominal',
    header: 'Nominal',
    cell: ({ row }) => {
      const nominal = row.getValue('nominal') as number
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(nominal)
      return h('div', { class: 'font-medium text-highlighted' }, formatted)
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = status === 'LUNAS' ? 'success' : 'warning'
      const label = status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'
      return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => label)
    },
    meta: {
      class: {
        td: 'text-center'
      }
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal Dibuat',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return h('div', { class: 'text-muted text-sm' }, date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }))
    }
  }
]

// Fetch data
async function fetchGajiData() {
  loading.value = true
  try {
    const response = await getMyGaji()
    if (response.status === 200 && response.data) {
      gajiList.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch gaji data:', error)
    useToast().add({
      title: 'Error',
      description: 'Gagal memuat data gaji',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  fetchGajiData()
})
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-highlighted">
        Daftar Gaji
      </h1>
      <p class="text-muted mt-1">
        Riwayat pembayaran gaji Anda
      </p>
    </div>

    <!-- Table -->
    <UTable :data="gajiList" :columns="columns" :loading="loading" class="w-full">
      <template #empty>
        <div class="text-center py-8">
          <UIcon name="i-lucide-wallet" class="size-12 mx-auto text-muted mb-3" />
          <p class="text-muted">Belum ada data gaji</p>
        </div>
      </template>
    </UTable>
  </div>
</template>

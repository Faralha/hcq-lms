<template>
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
          <p class="text-sm text-[--ui-text-muted]">Tidak ada announcement untuk kelas ini</p>
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
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import type { Announcement } from '~/composables/useAnnouncementApi'

const UBadge = resolveComponent('UBadge')

const props = defineProps<{
  kelasId: string
}>()

// Composables
const { getAllAnnouncements } = useAnnouncementApi()

// State
const classAnnouncements = ref<Announcement[]>([])
const isLoadingAnnouncements = ref(false)

const announcementsPagination = ref({
  pageIndex: 0,
  pageSize: 3
})
const announcementsTable = useTemplateRef('announcementsTable')

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
  }
]

// Fetch announcements
async function fetchAnnouncements() {
  try {
    isLoadingAnnouncements.value = true
    const response = await getAllAnnouncements()
    // Filter announcements for this kelas (GLOBAL or specific to this kelas)
    const filtered = (response.data || []).filter(
      (ann: Announcement) => ann.scope === 'GLOBAL' || ann.kelasId === props.kelasId
    )
    classAnnouncements.value = filtered
  } catch (error) {
    console.error('Error fetching announcements:', error)
    classAnnouncements.value = []
  } finally {
    isLoadingAnnouncements.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchAnnouncements()
})

// Expose refresh method
defineExpose({
  refresh: fetchAnnouncements
})
</script>

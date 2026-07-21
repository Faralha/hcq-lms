<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold">Pengajar yang Diundang</h2>
      <p class="text-[--ui-text-muted] mt-1">Kelola undangan pengajar yang telah dikirim.</p>
    </div>

    <!-- Tableview -->
    <div class="flex flex-col flex-1 w-full border border-accented rounded-lg overflow-hidden">
      <!-- Filter & Actions Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-accented">
        <UInput v-model="emailFilter" class="max-w-sm min-w-[12ch]" placeholder="Filter by email..."
          icon="i-lucide-search">
          <template #trailing>
            <UButton v-show="emailFilter !== ''" color="neutral" variant="link" icon="i-lucide-x" :padded="false"
              @click="emailFilter = ''" />
          </template>
        </UInput>
      </div>

      <!-- Table -->
      <UTable ref="table" :data="filteredInvitations" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted]">
        {{ filteredInvitations.length }} undangan ditemukan
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PengajarInvitation } from '~/composables/useInvitationApi'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UTable = resolveComponent('UTable')
const UInput = resolveComponent('UInput')

const toast = useToast()
const { getAllInvitations, resendInvitation, deleteInvitation } = useInvitationApi()

// State
const invitations = ref<PengajarInvitation[]>([])
const isLoading = ref(false)
const emailFilter = ref('')
const table = useTemplateRef('table')

// Computed
const filteredInvitations = computed(() => {
  if (!emailFilter.value) return invitations.value
  return invitations.value.filter(invitation =>
    invitation.email.toLowerCase().includes(emailFilter.value.toLowerCase())
  )
})

// Table Columns
const columns: TableColumn<PengajarInvitation>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'lowercase' }, row.getValue('email'))
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = {
        PENDING: 'warning' as const,
        EXPIRED: 'error' as const,
        USED: 'success' as const
      }[status] || 'neutral' as const

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color
      }, () => status.toLowerCase())
    }
  },
  {
    accessorKey: 'expiresAt',
    header: 'Berlaku Hingga',
    cell: ({ row }) => {
      const date = new Date(row.getValue('expiresAt') as string)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt') as string)
      return date.toLocaleDateString('id-ID', {
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
      const items: any[] = [
        {
          type: 'label' as const,
          label: 'Aksi'
        }
      ]

      // Hanya bisa resend jika status PENDING
      if (row.original.status === 'PENDING') {
        items.push({
          label: 'Kirim Ulang Undangan',
          icon: 'i-lucide-send',
          onSelect: () => handleResend(row.original)
        })
      }

      items.push({
        type: 'separator' as const
      })

      items.push({
        label: 'Hapus Undangan',
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect: () => handleDelete(row.original)
      })

      return h('div', { class: 'text-right' }, h(UDropdownMenu, {
        'content': {
          align: 'end'
        },
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
async function fetchInvitations() {
  isLoading.value = true
  try {
    const response = await getAllInvitations()

    console.log('[INVITATIONS] API Response:', response)

    if (response.status === 200 && Array.isArray(response.data)) {
      invitations.value = response.data
    } else {
      throw new Error('Invalid response format from server')
    }
  } catch (error: any) {
    console.error('[INVITATIONS] Error:', error)
    toast.add({
      title: 'Error loading invitations',
      description: error.message || 'Failed to fetch invitations',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

async function handleResend(invitation: PengajarInvitation) {
  try {
    const response = await resendInvitation(invitation.id)

    if (response.status === 200) {
      toast.add({
        title: 'Undangan Terkirim',
        description: `Undangan telah dikirim ulang ke ${invitation.email}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Log magic link for development
      if (response.data?.magicLink) {
        console.log('Magic Link:', response.data.magicLink)
        toast.add({
          title: 'Magic Link (Dev Mode)',
          description: 'Link telah di-copy ke console. Buka console untuk melihat.',
          color: 'info',
          icon: 'i-lucide-info'
        })
      }

      await fetchInvitations()
    } else {
      throw new Error(response.message || 'Failed to resend invitation')
    }
  } catch (error: any) {
    console.error('[RESEND] Error:', error)
    toast.add({
      title: 'Gagal Mengirim Ulang Undangan',
      description: error.message || error.data?.message || 'Terjadi kesalahan saat mengirim ulang undangan',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function handleDelete(invitation: PengajarInvitation) {
  const confirmed = confirm(`Apakah Anda yakin ingin menghapus undangan untuk ${invitation.email}?`)

  if (!confirmed) return

  try {
    const response = await deleteInvitation(invitation.id)

    if (response.status === 200) {
      toast.add({
        title: 'Undangan Dihapus',
        description: `Undangan untuk ${invitation.email} telah dihapus`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Remove from local state
      invitations.value = invitations.value.filter(inv => inv.id !== invitation.id)
    } else {
      throw new Error(response.message || 'Failed to delete invitation')
    }
  } catch (error: any) {
    console.error('[DELETE] Error:', error)
    toast.add({
      title: 'Gagal Menghapus Undangan',
      description: error.message || error.data?.message || 'Terjadi kesalahan saat menghapus undangan',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Load invitations on mount
onMounted(() => {
  fetchInvitations()
})
</script>
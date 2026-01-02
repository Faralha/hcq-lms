<template>
  <div class="space-y-6">
    <!-- Greetings/Header -->
    <div>
      <p class="text-lg font-medium text-[--ui-text-muted]">Manajemen</p>
      <h1 class="text-3xl font-bold">Atur Pengguna</h1>
    </div>

    <!-- Invite Pengajar -->
    <UModal v-model:open="isInviteModalOpen" title="Undang Pengajar Baru"
      description="Undang pengajar baru dengan magic link langsung ke inbox email.">
      <UButton label="Invite Pengajar" icon="i-lucide-user-plus" @click="isInviteModalOpen = true" />

      <template #body>
        <UForm :schema="inviteSchema" :state="inviteState" @submit="onInviteSubmit">
          <UFormField label="Email" name="email" required class="w-full">
            <UInput v-model="inviteState.email" type="email" placeholder="teacher@gmail.com" class="w-full" />
          </UFormField>

          <UFormField class="mt-4">
            <UButton type="submit" block color="primary" :loading="isInviting" :disabled="isInviting">
              Kirim Undangan
            </UButton>
          </UFormField>
        </UForm>
      </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Edit User</h3>
          </template>

          <UForm :schema="editSchema" :state="editForm" @submit="onEditSubmit" class="space-y-4">
            <UFormField label="Nama" name="nama" required>
              <UInput class="w-full" v-model="editForm.nama" placeholder="Fulan" />
            </UFormField>

            <UFormField label="Email" name="email" required>
              <UInput class="w-full" v-model="editForm.email" type="email" placeholder="fulan@gmail.com" />
            </UFormField>

            <UFormField label="Nama Lengkap" name="fullName">
              <UInput class="w-full" v-model="editForm.fullName" placeholder="Ahmad Fulan" />
            </UFormField>

            <UFormField label="Kota" name="cities">
              <UInput class="w-full" v-model="editForm.cities" placeholder="Jakarta" />
            </UFormField>

            <UFormField label="Alamat" name="address">
              <UTextarea class="w-full" v-model="editForm.address" placeholder="Jl. Merak No. 123" :rows="3" />
            </UFormField>

            <UFormField label="Nomor Telepon" name="phoneNumber">
              <UInput class="w-full" v-model="editForm.phoneNumber" placeholder="081234567890" />
            </UFormField>

            <div class="w-full flex flex-col items-center gap-3">
              <UButton class="w-full justify-center" type="submit" :loading="isEditing">
                Update
              </UButton>
              <UButton class="w-full justify-center" color="error" variant="outline" @click="closeEditModal">
                Batal
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

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
      <UTable ref="table" :data="users" :columns="columns" :loading="isLoading" loading-color="primary"
        loading-animation="carousel" class="flex-1" />

      <!-- Footer Info -->
      <div class="px-4 py-3.5 border-t border-accented text-sm text-[--ui-text-muted]">
        {{ filteredUsersCount }} user(s) found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import * as z from 'zod'
import type { TableColumn, FormSubmitEvent } from '@nuxt/ui'
import type { User } from '~/composables/useUserApi'

definePageMeta({
  layout: 'menu',
  middleware: 'auth',
  ssr: false,
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { getAllUsers, deleteUser, updateUser } = useUserApi()
const { invitePengajar } = useAuthApi()

// State
const users = ref<User[]>([])
const isLoading = ref(false)
const isInviting = ref(false)
const isInviteModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isEditing = ref(false)
const emailFilter = ref('')
const table = useTemplateRef('table')

// Invite form state
const inviteState = reactive({
  email: '',
})

// Invite form validation schema
const inviteSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

// Edit form state
const editSchema = z.object({
  id: z.string(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  fullName: z.string().optional(),
  cities: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional()
})

type EditSchema = z.output<typeof editSchema>

const editForm = reactive<Partial<EditSchema>>({
  id: '',
  nama: '',
  email: '',
  fullName: '',
  cities: '',
  address: '',
  phoneNumber: ''
})

// Computed
const filteredUsersCount = computed(() => {
  if (!emailFilter.value) return users.value.length
  return users.value.filter(user =>
    user.email.toLowerCase().includes(emailFilter.value.toLowerCase())
  ).length
})

// Table Columns
const columns: TableColumn<User>[] = [
  {
    accessorKey: 'nama',
    header: 'Name',
    cell: ({ row }) => {
      return h('div', {}, [
        h('p', { class: 'font-medium text-[--ui-text-highlighted]' }, row.original.nama),
        row.original.fullName && h('p', { class: 'text-sm text-[--ui-text-muted]' }, row.original.fullName)
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'lowercase' }, row.getValue('email'))
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const color = {
        ADMIN: 'error' as const,
        PENGAJAR: 'primary' as const,
        PELAJAR: 'success' as const
      }[role] || 'neutral' as const

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color
      }, () => role.toLowerCase())
    }
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => row.original.phoneNumber || '-'
  },
  {
    accessorKey: 'cities',
    header: 'City',
    cell: ({ row }) => row.original.cities || '-'
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
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
          label: 'Edit User',
          icon: 'i-lucide-edit',
          onSelect: () => handleEdit(row.original)
        },
        {
          type: 'separator' as const
        },
        {
          label: 'Delete User',
          icon: 'i-lucide-trash',
          color: 'error' as const,
          onSelect: () => handleDelete(row.original)
        }
      ]

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
async function onInviteSubmit(event: FormSubmitEvent<z.output<typeof inviteSchema>>) {
  if (isInviting.value) return

  isInviting.value = true

  try {
    const response = await invitePengajar(event.data.email)

    if (response.status === 201 || response.status === 200) {
      toast.add({
        title: 'Undangan Terkirim',
        description: `Link undangan telah dikirim ke ${event.data.email}`,
        color: 'success',
        icon: 'i-lucide-check-circle',
      })

      // Log magic link for development (in production this should be sent via email)
      if (response.data?.magicLink) {
        console.log('Magic Link:', response.data.magicLink)
        toast.add({
          title: 'Magic Link (Dev Mode)',
          description: 'Link telah di-copy ke console. Buka console untuk melihat.',
          color: 'info',
          icon: 'i-lucide-info',
        })
      }

      // Reset form and close modal
      inviteState.email = ''
      isInviteModalOpen.value = false
    } else {
      throw new Error(response.message || 'Gagal mengirim undangan')
    }
  } catch (error: any) {
    console.error('[INVITE] Error:', error)
    toast.add({
      title: 'Gagal Mengirim Undangan',
      description: error.message || error.data?.message || 'Terjadi kesalahan saat mengirim undangan',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isInviting.value = false
  }
}

async function fetchUsers() {
  isLoading.value = true
  try {
    const response = await getAllUsers()

    console.log('[USERS] API Response:', response)

    // API returns array directly based on API_DOCUMENTATION.md
    // GET /users returns: [{ id, email, nama, role, ... }]
    if (response.status === 200 && Array.isArray(response.data)) {
      users.value = response.data
      // toast.add({
      //   title: 'Users loaded successfully',
      //   description: `Loaded ${response.data.length} user(s)`,
      //   color: 'success',
      //   icon: 'i-lucide-check-circle'
      // })
    } else {
      throw new Error('Invalid response format from server')
    }
  } catch (error: any) {
    console.error('[USERS] Error:', error)
    toast.add({
      title: 'Error loading users',
      description: error.message || 'Failed to fetch users',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

function handleEdit(user: User) {
  editForm.id = user.id
  editForm.nama = user.nama
  editForm.email = user.email
  editForm.fullName = user.fullName || ''
  editForm.cities = user.cities || ''
  editForm.address = user.address || ''
  editForm.phoneNumber = user.phoneNumber || ''
  isEditModalOpen.value = true
}

function closeEditModal() {
  isEditModalOpen.value = false
  editForm.id = ''
  editForm.nama = ''
  editForm.email = ''
  editForm.fullName = ''
  editForm.cities = ''
  editForm.address = ''
  editForm.phoneNumber = ''
}

async function onEditSubmit() {
  if (isEditing.value) return

  isEditing.value = true

  try {
    const payload = {
      nama: editForm.nama || '',
      email: editForm.email || '',
      fullName: editForm.fullName || undefined,
      cities: editForm.cities || undefined,
      address: editForm.address || undefined,
      phoneNumber: editForm.phoneNumber || undefined
    }

    const response = await updateUser(editForm.id || '', payload)

    if (response.status === 200) {
      toast.add({
        title: 'User updated successfully',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      closeEditModal()
      await fetchUsers()
    } else {
      throw new Error(response.message || 'Failed to update user')
    }
  } catch (error: any) {
    toast.add({
      title: 'Error updating user',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isEditing.value = false
  }
}

async function handleDelete(user: User) {
  const confirmed = confirm(`Are you sure you want to delete ${user.nama}?`)

  if (!confirmed) return

  try {
    const response = await deleteUser(user.id)

    if (response.status === 200) {
      toast.add({
        title: 'User deleted successfully',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // Remove user from local state
      users.value = users.value.filter(u => u.id !== user.id)
    } else {
      throw new Error(response.message || 'Failed to delete user')
    }
  } catch (error: any) {
    toast.add({
      title: 'Error deleting user',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Watch email filter and update table
watch(emailFilter, (value) => {
  table.value?.tableApi?.getColumn('email')?.setFilterValue(value)
})

// Load users on mount
onMounted(() => {
  fetchUsers()
})
</script>
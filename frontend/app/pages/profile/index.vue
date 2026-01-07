<template>
  <div class="">
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Profil</h1>
      <p class="text-lg text-muted">Lihat dan kelola informasi profil Anda</p>
    </div>

    <div v-if="user">

      <!-- Menu -->
      <div class="flex items-center gap-4">
        <UButton v-if="!isEditing" @click="startEdit" icon="i-lucide-pencil" label="Edit" color="primary"
         size="lg"/>
        <div v-else class="flex gap-2">
          <UButton @click="cancelEdit" label="Batal" icon="i-lucide-trash-2" color="error" size="lg" />
        </div>
      </div>

      <!-- Edit Profile (Default) -->
      <UPageCard class="mt-2">
        <div v-if="!isEditing" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted">Nama</label>
            <p class="text-base mt-1">{{ user.nama }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Email</label>
            <p class="text-base mt-1">{{ user.email }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Nama Lengkap</label>
            <p class="text-base mt-1">{{ user.fullName || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Nomor Telepon</label>
            <p class="text-base mt-1">{{ user.phoneNumber || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Kota</label>
            <p class="text-base mt-1">{{ user.cities || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Alamat</label>
            <p class="text-base mt-1">{{ user.address || '-' }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Role</label>
            <p class="text-base mt-1">
              <UBadge :label="user.role" color="primary" variant="subtle" size="lg" class="px-3"/>
            </p>
          </div>
        </div>

        <UForm v-else :schema="schema" :state="editState" class="space-y-4 max-w-3xl" @submit="onSubmit">
          <UFormField name="nama" label="Nama" class="w-full">
            <UInput v-model="editState.nama" size="lg" class="w-full" />
          </UFormField>

          <UFormField name="email" label="Email" class="w-full">
            <UInput v-model="editState.email" type="email" size="lg" class="w-full" disabled />
          </UFormField>

          <UFormField name="fullName" label="Nama Lengkap" class="w-full">
            <UInput v-model="editState.fullName" size="lg" class="w-full" />
          </UFormField>

          <UFormField name="phoneNumber" label="Nomor Telepon" class="w-full">
            <UInput v-model="editState.phoneNumber" size="lg" class="w-full" />
          </UFormField>

          <UFormField name="cities" label="Kota" class="w-full">
            <UInput v-model="editState.cities" size="lg" class="w-full" />
          </UFormField>

        <UFormField name="address" label="Alamat" class="w-full">
          <UTextarea v-model="editState.address" size="lg" :rows="3" class="w-full" />
        </UFormField>

        <UButton @click="saveChanges" icon="i-lucide-save" label="Simpan" color="primary" :loading="isSaving"
          :disabled="isSaving" size="lg" class="w-full items-center justify-center" />
      </UForm>
    </UPageCard>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <UIcon name="i-lucide-loader-circle" class="animate-spin h-8 w-8" />
  </div>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '~/types/entities';

definePageMeta({
  layout: 'menu',
  ssr: false
})

const schema = z.object({
  nama: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid'),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  cities: z.string().optional(),
  address: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

const user: Ref<User | null> = ref(null);
const isEditing = ref(false);
const isSaving = ref(false);
const isChangingPassword = ref(false);
const editState = reactive<Partial<Schema>>({
  nama: '',
  email: '',
  fullName: '',
  phoneNumber: '',
  cities: '',
  address: '',
});

const toast = useToast();

async function fetchProfile() {
  try {
    const { getMe } = useUserApi();
    const response = await getMe();

    if (response.status >= 200 && response.status < 300 && response.data) {
      console.log('[PROFILE] Fetched user profile:', response.data);
      user.value = response.data;
    }
  } catch (error) {
    console.error('[PROFILE] Error fetching profile:', error);
    toast.add({
      title: 'Gagal',
      description: 'Gagal memuat profil',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

function startEdit() {
  if (!user.value) return;

  isEditing.value = true;
  isChangingPassword.value = false;
  editState.nama = user.value.nama;
  editState.email = user.value.email;
  editState.fullName = user.value.fullName || '';
  editState.phoneNumber = user.value.phoneNumber || '';
  editState.cities = user.value.cities || '';
  editState.address = user.value.address || '';
}

function cancelEdit() {
  isEditing.value = false;
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await saveChanges();
}

async function saveChanges() {
  if (!user.value || isSaving.value) return;

  isSaving.value = true;

  try {
    const { updateUser } = useUserApi();
    const response = await updateUser(user.value.id, {
      nama: editState.nama,
      email: editState.email,
      fullName: editState.fullName || undefined,
      phoneNumber: editState.phoneNumber || undefined,
      cities: editState.cities || undefined,
      address: editState.address || undefined,
    });

    if (response.status >= 200 && response.status < 300 && response.data) {
      user.value = response.data;
      isEditing.value = false;

      toast.add({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
    } else {
      throw new Error('Gagal memperbarui profil');
    }
  } catch (error: any) {
    console.error('[PROFILE] Error updating profile:', error);
    toast.add({
      title: 'Gagal',
      description: error.message || 'Terjadi kesalahan saat memperbarui profil',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  fetchProfile();
});
</script>
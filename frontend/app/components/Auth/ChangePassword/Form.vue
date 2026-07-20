<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField class="w-full" name="currentPassword" label="Password Lama">
      <UInput v-model="state.currentPassword" size="lg" class="w-full" type="password" />
    </UFormField>

    <UFormField class="w-full" name="newPassword" label="Password Baru">
      <UInput v-model="state.newPassword" size="lg" class="w-full" type="password" />
    </UFormField>

    <UFormField class="w-full" name="confirmNewPassword" label="Konfirmasi Password Baru">
      <UInput v-model="state.confirmNewPassword" size="lg" class="w-full" type="password" />
    </UFormField>

    <UButton size="lg" type="submit" class="w-full" :ui="{ base: 'justify-center' }" :loading="isSubmitting"
      :disabled="isSubmitting">
      Ubah Password
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const schema = z.object({
  currentPassword: z.string().min(6, 'Password lama harus minimal 6 karakter'),
  newPassword: z.string().min(6, 'Password baru harus minimal 6 karakter'),
  confirmNewPassword: z.string().min(6, 'Konfirmasi password harus minimal 6 karakter'),
})
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    error: 'Password baru dan konfirmasi password tidak sesuai',
  })

type Schema = z.infer<typeof schema>;

// States
const state = reactive<Partial<Schema>>({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})
const isSubmitting = ref(false);

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const values = event.data;

    // Call API to change password
    const { changePassword } = useAuthApi();

    const oldPassword = values.currentPassword;
    const newPassword = values.newPassword;
    const response = await changePassword(oldPassword, newPassword);

    console.log('[AUTH] Changing Password...')

    if (response.status >= 200 && response.status < 300) {
      toast.add({
        title: 'Berhasil',
        description: 'Password berhasil diubah',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
      console.log('[AUTH] Password changed successfully');
    } else {
      throw new Error(response.data?.message || 'Gagal mengubah password');
    }
  } catch (error: any) {
    console.error('[AUTH] Error changing password:', error);
    toast.add({
      title: 'Gagal',
      description: error.message || 'Terjadi kesalahan saat mengubah password',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
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

  <!-- Failure Modal -->
  <UModal v-model:open="isFailed">
    <template #content>
      <div class="p-6 pt-12 text-center">
        <UIcon name="i-lucide-alert-circle" class="bg-error mx-auto mb-4 h-20 w-20 text-primary" />
        <h2 class="mb-2 text-2xl font-bold">Gagal</h2>
        <p class="px-4">
          Terjadi kesalahan saat mengubah password. Silakan coba lagi.</p>
        <UButton @click="isFailed = false" label="Tutup" class="w-full mt-6" size="lg" :ui="{base: 'justify-center'}" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const route = useRoute();
const router = useRouter();

const schema = z.object({
  newPassword: z.string().min(6, 'Password baru harus minimal 6 karakter'),
  confirmNewPassword: z.string().min(6, 'Konfirmasi password harus minimal 6 karakter'),
})
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    error: 'Password baru dan konfirmasi password tidak sesuai',
  })

type Schema = z.infer<typeof schema>;

// States
const state = reactive<Partial<Schema>>({
  newPassword: '',
  confirmNewPassword: '',
})
const isSubmitting = ref(false);
const isFailed = ref(false);

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const values = event.data;
    const token = route.query.token as string;

    // Call API to change password
    const { resetPassword } = useAuthApi();

    const data = {
      token,
      password: values.newPassword,
      confirmPassword: values.confirmNewPassword
    };
    const response = await resetPassword(data)

    console.log('[AUTH] Changing Password...')

    if (response.status >= 200 && response.status < 300) {
      toast.add({
        title: 'Berhasil',
        description: 'Password berhasil diubah',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
      console.log('[AUTH] Password changed successfully');
      router.push('/auth/login')
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
    isFailed.value = true;
  } finally {
    isSubmitting.value = false;
  }
}
</script>
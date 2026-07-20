<template>
  <!-- Email Form -->
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="onSubmit">
    <UFormField class="w-full" label="Email" required name="email">
      <UInput class="w-full" v-model="state.email" type="email" label="Email" required />
    </UFormField>

    <UButton 
      class="w-full" 
      label="Kirim" 
      size="lg" 
      type="submit" 
      :loading="isSubmitting" 
      :disabled="isSubmitting"
      :ui="{
        base: 'justify-center'
      }" />
  </UForm>

  <!-- Form request send confirmation -->
  <UModal v-model:open="open">
    <template #content>
      <div class="p-6 pt-12 text-center">
        <UIcon name="i-lucide-mail-check" class="bg-success mx-auto mb-4 h-20 w-20 text-primary" />
        <h2 class="mb-2 text-2xl font-bold">Permintaan Terkirim</h2>
        <p class="px-4">
          Permintaan reset telah dikirim. Silakan cek inbox atau 
          <span class="font-semibold">folder spam email</span> anda.</p>
        <UButton @click="open = false" label="Tutup" class="w-full mt-6" size="lg" :ui="{base: 'justify-center'}" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const toast = useToast();

const schema = z.object({
  email: z.email('Email tidak valid'),
});

type Schema = z.infer<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: '',
});
const isSubmitting = ref(false);
const open = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const values = event.data;

    // Call API to request password reset
    const { forgotPassword } = useAuthApi();
    const response = await forgotPassword(values.email);

    if (response.status >= 200 && response.status < 300) {
      open.value = true;
    } else {
      throw new Error(response.data?.message || 'Gagal mengirim link reset password');
    }
  } catch (error: any) {
    console.error('[AUTH] Error requesting password reset:', error);
    toast.add({
      title: 'Gagal',
      description: error.message || 'Terjadi kesalahan saat mengirim link reset password',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isSubmitting.value = false;
  }
}

</script>
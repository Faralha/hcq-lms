<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
    <UPageCard class="w-full max-w-md">

      <!-- Auth Form -->
      <UAuthForm :schema="schema" title="Register" description="Isi form dengan data yang sesuai"
        icon="i-lucide-user-plus" :fields="fields" @submit="onSubmit">

        <!-- Login CTA Footer -->
        <template #footer name="footer">
          <div class="text-sm">
            Sudah punya akun?
            <NuxtLink to="/auth/login" class="text-primary-600 hover:underline">
              Masuk di sini
            </NuxtLink>
          </div>
        </template>
      </UAuthForm>

    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import type { RegisterRequest } from '~/types/auth'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const toast = useToast()
const authApi = useAuthApi()
const router = useRouter()

// Loading state
const isSubmitting = ref(false)

const cities = [
  { id: 'tangerang-selatan', name: 'Tangerang Selatan' },
  { id: 'tangerang-kota', name: 'Tangerang Kota' }
]

const fields: AuthFormField[] = [
  {
    name: 'fullName',
    type: 'text',
    label: 'Nama Lengkap',
    placeholder: 'Fulanah binti Fulan',
    required: true
  }, {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'fulan@gmail.com',
    required: true
  }, {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: '(minimal 8 karakter)',
    required: true
  }, {
    name: 'confirmPassword',
    label: 'Konfirmasi Password',
    type: 'password',
    placeholder: 'Ketik ulang password anda',
    required: true
  }, {
    name: 'phoneNumber',
    label: 'Nomor Telepon',
    type: 'text',
    placeholder: '081234567890',
    required: true
  }, {
    name: 'city',
    label: 'Kota',
    type: 'select',
    placeholder: 'Pilih kota tempat tinggal anda',
    required: true,
    items: cities.map(c => ({ label: c.name, value: c.id }))
  }, {
    name: 'address',
    label: 'Alamat Lengkap',
    type: 'text',
    placeholder: 'Jl. Merdeka No. 123, RT 01 RW 02, Kec. Contoh, Kota Contoh, 12345',
    required: true
  }]

const schema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter'),
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  city: z.string().min(1, 'Pilih kota'),
  address: z.string().min(10, 'Alamat minimal 10 karakter'),
}).superRefine((data, ctx) => {
  if (data.confirmPassword !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Password tidak cocok',
    })
  }
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const registerData: RegisterRequest = {
      fullName: payload.data.fullName,
      email: payload.data.email,
      password: payload.data.password,
      confirmPassword: payload.data.confirmPassword,
      phoneNumber: payload.data.phoneNumber,
      city: payload.data.city,
      address: payload.data.address,
    }

    console.log('Sending register request:', registerData)
    const response = await authApi.register(registerData)

    console.log('Register response:', response)

    // Check if response exists (success case)
    if (response) {
      // Response sukses bisa berupa response.success === true atau langsung data
      const isSuccess = response.success !== false

      if (isSuccess) {
        toast.add({
          title: 'Registrasi Berhasil',
          description: response.message || 'Akun Anda telah dibuat. Silakan login.',
          color: 'success',
          icon: 'i-lucide-check-circle',
        })

        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push('/auth/login')
        }, 1500)
      } else {
        throw new Error(response.message || 'Registrasi gagal')
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)

    toast.add({
      title: 'Registrasi Gagal',
      description: error.message || error.data?.message || 'Terjadi kesalahan saat registrasi',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
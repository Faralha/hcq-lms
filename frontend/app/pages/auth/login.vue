<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
    <UPageCard class="w-full max-w-md">

      <!-- Auth Form -->
      <UAuthForm :schema="schema" title="Login" description="Masukkan Kredensial untuk mengakses akun anda"
        icon="i-lucide-user" :fields="fields" @submit="onSubmit">

        <!-- Daftar CTA Footer -->
        <template #footer name="footer">
          <div class="text-sm">
            Belum punya akun?
            <NuxtLink to="/auth/register" class="text-primary-600 hover:underline">
              Daftar di sini
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
import type { LoginRequest } from '~/types/auth'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const toast = useToast()
const authApi = useAuthApi()
const router = useRouter()
const { setUser } = useAuth()

// Loading state
const isSubmitting = ref(false)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'fulan@gmail.com',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Masukkan password Anda',
  required: true
}, {
  name: 'remember',
  label: 'Ingat saya',
  type: 'checkbox'
}]

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  remember: z.boolean().optional(),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const loginData: LoginRequest = {
      email: payload.data.email,
      password: payload.data.password,
    }

    console.log('[Login] Sending login request:', loginData)
    const response = await authApi.login(loginData)

    console.log('[Login] Full response:', JSON.stringify(response, null, 2))
    console.log('[Login] Response type:', typeof response)
    console.log('[Login] Response keys:', Object.keys(response || {}))

    // Handle different response structures from backend
    // Backend might return:
    // 1. { accessToken, refreshToken, user }
    // 2. { data: { accessToken, refreshToken, user } }
    // 3. { success: true, data: { accessToken, refreshToken, user } }

    let accessToken: string | undefined
    let refreshToken: string | undefined
    let userData: any

    // Cast to any for flexible structure handling
    const res = response as any

    // Try to extract data from different structures
    if (res.status === 200 && res.data) {
      // New standard structure: { status: 200, data: { accessToken, refreshToken, user } }
      accessToken = res.data.accessToken
      refreshToken = res.data.refreshToken
      userData = res.data.user
      console.log('[Login] Using standard response structure')
    } else if (res.accessToken) {
      // Direct structure: { accessToken, refreshToken, user }
      accessToken = res.accessToken
      refreshToken = res.refreshToken
      userData = res.user
      console.log('[Login] Using direct response structure')
    } else if (res.data?.accessToken) {
      // Nested structure: { data: { accessToken, refreshToken, user } }
      accessToken = res.data.accessToken
      refreshToken = res.data.refreshToken
      userData = res.data.user
      console.log('[Login] Using nested data structure')
    } else if (res.data?.data?.accessToken) {
      // Double nested: { data: { data: { accessToken, ... } } }
      accessToken = res.data.data.accessToken
      refreshToken = res.data.data.refreshToken
      userData = res.data.data.user
      console.log('[Login] Using double nested structure')
    }

    console.log('[Login] Extracted accessToken:', accessToken?.substring(0, 20) + '...')
    console.log('[Login] Extracted user:', userData)

    if (userData && accessToken) {
      // Save user and access token
      setUser(userData, accessToken)

      console.log('[Login] Access token saved to sessionStorage')
      console.log('[Login] User role:', userData.role)

      toast.add({
        title: 'Login Berhasil',
        description: `Selamat datang, ${userData.fullName || userData.nama || userData.email}!`,
        color: 'success',
        icon: 'i-lucide-check-circle',
      })

      // Redirect based on role
      setTimeout(() => {
        if (userData.role) {
          const role = userData.role.toLowerCase()
          console.log('[Login] Redirecting to role:', role)

          if (role === 'admin') {
            router.push('/admin')
          } else if (role === 'pengajar') {
            router.push('/pengajar')
          } else if (role === 'pelajar') {
            router.push('/pelajar')
          } else {
            router.push('/')
          }
        } else {
          console.warn('[Login] No role found, redirecting to /')
          router.push('/')
        }
      }, 500)
    } else {
      console.error('[Login] Missing data - accessToken:', !!accessToken, 'userData:', !!userData)
      throw new Error('Invalid response: missing user data or access token')
    }
  } catch (error: any) {
    console.error('[Login] Login error:', error)
    console.error('[Login] Error details:', JSON.stringify(error, null, 2))

    toast.add({
      title: 'Login Gagal',
      description: error.message || error.data?.message || 'Email atau password salah',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
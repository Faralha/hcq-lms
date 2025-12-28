<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
    <UPageCard class="w-full max-w-md">

      <!-- Header -->
      <div class="flex flex-col text-left mb-6">
        <div class="py-6 items-center justify-center flex">
          <img src="/hcq.png" class="h-12 w-auto" />
        </div>
        <h1 class="text-2xl text-pretty font-semibold text-highlighted">Masuk</h1>
        <p class="mt-1 text-base text-pretty text-muted">Masukkan Kredensial untuk mengakses akun anda</p>
      </div>

      <!-- Form -->
      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-5">
        <UFormField label="Email" name="email" required class="w-full">
          <UInput v-model="state.email" type="email" placeholder="fulan@gmail.com" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password" required class="w-full">
          <UInput v-model="state.password" type="password" placeholder="Masukkan password Anda" class="w-full" />
        </UFormField>

        <UFormField name="remember" class="w-full">
          <UCheckbox v-model="state.remember" label="Ingat saya" />
        </UFormField>

        <UButton type="submit" block :loading="isSubmitting" :disabled="isSubmitting">
          Login
        </UButton>
      </UForm>

      <!-- Footer -->
      <div class="text-sm text-center text-muted mt-6">
        Belum punya akun?
        <NuxtLink to="/auth/register" class="text-primary-600 hover:underline">
          Daftar di sini
        </NuxtLink>
      </div>

    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { LoginRequest } from '~/types/auth'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const toast = useToast()
const authApi = useAuthApi()
const router = useRouter()
const route = useRoute()
const { setUser } = useAuth()

// Loading state
const isSubmitting = ref(false)

// Get email and redirect from query parameters
const emailFromQuery = route.query.email ? String(route.query.email) : ''
const redirectTo = route.query.redirect ? String(route.query.redirect) : ''

// Form state with email from query parameter
const state = reactive({
  email: emailFromQuery,
  password: '',
  remember: false,
})

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

      // Redirect based on redirect query or role
      setTimeout(() => {
        // If redirect query exists, use it
        if (redirectTo) {
          console.log('[Login] Redirecting to:', redirectTo)
          router.push(redirectTo)
          return
        }

        // Otherwise, redirect based on role
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
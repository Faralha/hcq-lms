<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <UCard>
        <template #header>
          <div class="text-center">
            <h1 class="text-2xl font-bold ">Validasi Undangan</h1>
            <p class="mt-2 text-sm text-muted">Mohon tunggu, undangan anda sebagai pengajar sedang divalidasi...</p>
          </div>
        </template>

        <div class="py-8">
          <!-- Loading State -->
          <div v-if="isValidating" class="flex flex-col items-center justify-center space-y-4">
            <div class="relative w-20 h-20">
              <!-- Animated Circle Spinner -->
              <svg class="animate-spin h-20 w-20 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
            <p class="text-gray-600 font-medium">Memvalidasi token...</p>
          </div>

          <!-- Success State -->
          <div v-else-if="validationSuccess" class="flex flex-col items-center justify-center space-y-4">
            <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="text-green-600 text-5xl" />
            </div>
            <div class="text-center">
              <p class="text-xl font-semibold">Token Valid!</p>
              <p class="mt-2 text-sm text-muted">Email: {{ validatedEmail }}</p>
              <p class="mt-1 text-sm text-muted">Anda akan diarahkan ke halaman registrasi...</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="validationError" class="flex flex-col items-center justify-center space-y-4">
            <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <UIcon name="i-heroicons-x-circle" class="text-red-600 text-5xl" />
            </div>
            <div class="text-center">
              <p class="text-xl font-semibold text-red-600">Token Tidak Valid</p>
              <p class="mt-2 text-sm text-gray-600">{{ errorMessage }}</p>
              <p class="mt-2 text-sm font-medium text-gray-700">Mohon hubungi administrator untuk mendapatkan link
                undangan yang
                baru.</p>
            </div>
            <UButton color="neutral" variant="outline" @click="navigateTo('/auth/login')" class="mt-4">
              Kembali ke Login
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidateInvitationResponse } from '~/types/auth'

definePageMeta({
  layout: 'auth',
  middleware: []
})

const route = useRoute()
const router = useRouter()
const { validateInvitation } = useAuthApi()

const isValidating = ref(true)
const validationSuccess = ref(false)
const validationError = ref(false)
const validatedEmail = ref('')
const errorMessage = ref('')

const token = computed(() => route.query.token as string)

onMounted(async () => {
  // Validasi bahwa token ada di query params
  if (!token.value) {
    validationError.value = true
    errorMessage.value = 'Token tidak ditemukan dalam URL'
    isValidating.value = false
    return
  }

  try {
    // Panggil API validasi
    const response = await validateInvitation(token.value)

    // Response structure: { status, message, data: { valid, email, expiresAt } }
    const validationData: ValidateInvitationResponse = 'data' in response && response.data
      ? response.data
      : response as unknown as ValidateInvitationResponse

    if (validationData.valid) {
      validationSuccess.value = true
      validatedEmail.value = validationData.email
      isValidating.value = false

      // Redirect ke halaman registrasi setelah 2 detik
      setTimeout(() => {
        router.push({
          path: '/auth/register-pengajar',
          query: {
            token: token.value,
            email: validationData.email
          }
        })
      }, 2000)
    } else {
      throw new Error(validationData.message || 'Token tidak valid')
    }
  } catch (error: any) {
    validationError.value = true
    isValidating.value = false

    // Handle berbagai jenis error dari API
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Terjadi kesalahan saat memvalidasi token'
    }
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

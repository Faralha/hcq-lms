<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4 p-4 md:w-120 md:my-8">
    <UPageCard class="w-full">

      <!-- Header -->
      <div class="flex flex-col text-left mb-6">
        <div class="py-6 items-center justify-center flex">
          <img src="/hcq.png" class="h-12 w-auto" />
        </div>
        <h1 class="text-2xl text-pretty font-semibold text-highlighted">Daftar Pengajar</h1>
        <p class="mt-1 text-base text-pretty text-muted">Isi form dengan data yang sesuai</p>
      </div>

      <!-- Form -->
      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-5">
        <UFormField label="Nama" name="nama" required class="w-full">
          <UInput v-model="state.nama" placeholder="Fulanah" class="w-full" />
        </UFormField>

        <UFormField label="Nama Lengkap" name="fullName" required class="w-full">
          <UInput v-model="state.fullName" placeholder="Fulanah binti Fulan" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required class="w-full">
          <UInput v-model="state.email" type="email" placeholder="fulan@gmail.com" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password" required class="w-full">
          <UInput v-model="state.password" type="password" placeholder="(minimal 8 karakter)" class="w-full" />
        </UFormField>

        <UFormField label="Konfirmasi Password" name="confirmPassword" required class="w-full">
          <UInput v-model="state.confirmPassword" type="password" placeholder="Ketik ulang password anda"
            class="w-full" />
        </UFormField>

        <UFormField label="Nomor Telepon" name="phoneNumber" required class="w-full">
          <UInput v-model="state.phoneNumber" placeholder="081234567890" class="w-full" />
        </UFormField>

        <UFormField label="Provinsi" name="province" required class="w-full">
          <USelectMenu v-model="state.province" :items="provinces" value-key="code" label-key="name"
            placeholder="Pilih provinsi" searchable searchable-placeholder="Cari provinsi..."
            :loading="isLoadingProvinces" class="w-full" @update:model-value="onProvinceChange" />
        </UFormField>

        <UFormField label="Kota/Kabupaten" name="cities" required class="w-full">
          <USelectMenu v-model="state.cities" :items="cities" value-key="code" label-key="name"
            :placeholder="state.province ? 'Pilih kota/kabupaten' : 'Pilih provinsi terlebih dahulu'" searchable
            searchable-placeholder="Cari kota/kabupaten..." :loading="isLoadingCities" :disabled="!state.province"
            class="w-full" />
        </UFormField>

        <UFormField label="Alamat Lengkap" name="address" required class="w-full">
          <UInput v-model="state.address"
            placeholder="Jl. Merdeka No. 123, RT 01 RW 02, Kec. Contoh, Kota Contoh, 12345" class="w-full" />
        </UFormField>

        <UButton type="submit" block :loading="isSubmitting" :disabled="isSubmitting">
          Daftar
        </UButton>
      </UForm>

      <!-- Footer -->
      <div class="text-sm text-center text-muted mt-6">
        Sudah punya akun?
        <NuxtLink to="/auth/login" class="text-primary-600 hover:underline">
          Masuk di sini
        </NuxtLink>
      </div>

    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RegisterRequest } from '~/types/auth'
import type { Regency, Province } from '~/utils/indonesianArea'
import { getIndonesianRegencies, getIndonesianProvinces } from '~/utils/indonesianArea'
import { loadFormFromStorage, saveFormToStorage, clearFormFromStorage } from '~/utils/formStorage'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const toast = useToast()
const authApi = useAuthApi()
const router = useRouter()
const route = useRoute()

// Loading state
const isSubmitting = ref(false)
const isLoadingProvinces = ref(true)
const isLoadingCities = ref(false)

// Get all provinces and regencies from Indonesia
const provinces = ref<Province[]>([])
const cities = ref<Regency[]>([])
const allRegencies = ref<Regency[]>([])

onMounted(async () => {
  try {
    // Load provinces and all regencies in parallel
    const [provincesData, regenciesData] = await Promise.all([
      getIndonesianProvinces(),
      getIndonesianRegencies()
    ])
    console.log('Loaded Indonesian area data:', { regenciesData })
    provinces.value = provincesData
    allRegencies.value = regenciesData

    // If there's saved province data, restore filtered cities
    if (savedData?.province) {
      cities.value = regenciesData.filter(r => r.provinceCode === savedData.province)
    }
  } catch (error) {
    console.error('Failed to load area data:', error)
    toast.add({
      title: 'Gagal memuat data wilayah',
      description: 'Terjadi kesalahan saat memuat data',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    })
  } finally {
    isLoadingProvinces.value = false
  }
})

// Get token from query parameter (required for pengajar registration)
const invitationToken = route.query.token ? String(route.query.token) : ''

// Storage key for this form
const STORAGE_KEY = 'register-pengajar-form'

// Load saved form data from localStorage
const savedData = loadFormFromStorage<any>(STORAGE_KEY)

// Form state with email from query parameter and saved data
const state = reactive({
  nama: savedData?.nama || '',
  fullName: savedData?.fullName || '',
  email: route.query.email ? String(route.query.email) : savedData?.email || '',
  password: '', // Never store passwords
  confirmPassword: '', // Never store passwords
  phoneNumber: savedData?.phoneNumber || '',
  province: savedData?.province || '',
  cities: savedData?.cities || '',
  address: savedData?.address || '',
})

// Auto-save form data (excluding passwords)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(
  () => state,
  (newState) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const dataToSave = {
        nama: newState.nama,
        fullName: newState.fullName,
        email: newState.email,
        phoneNumber: newState.phoneNumber,
        province: newState.province,
        cities: newState.cities,
        address: newState.address,
      }
      saveFormToStorage(STORAGE_KEY, dataToSave)
    }, 500) // Debounce 500ms
  },
  { deep: true }
)

// Handle province change to filter cities
function onProvinceChange(provinceCode: string) {
  // Reset city when province changes
  state.cities = ''
  // Filter cities based on selected province
  if (provinceCode) {
    isLoadingCities.value = true
    cities.value = allRegencies.value.filter(r => r.provinceCode === provinceCode)
    isLoadingCities.value = false
  } else {
    cities.value = []
  }
}

const schema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter'),
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  province: z.string().min(1, 'Pilih provinsi'),
  cities: z.string().min(1, 'Pilih kota/kabupaten'),
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

  // Validate token exists (required for pengajar registration)
  if (!invitationToken) {
    toast.add({
      title: 'Token Tidak Valid',
      description: 'Link registrasi tidak valid atau sudah kadaluarsa. Hubungi admin untuk mendapatkan link baru.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
    return
  }

  isSubmitting.value = true

  try {
    // Find province and city names from codes
    const selectedProvince = provinces.value.find(p => p.code === payload.data.province)
    const selectedCity = cities.value.find(c => c.code === payload.data.cities)

    if (!selectedProvince || !selectedCity) {
      throw new Error('Data provinsi atau kota tidak valid')
    }

    const registerData: RegisterRequest = {
      nama: payload.data.nama,
      fullName: payload.data.fullName,
      email: payload.data.email,
      password: payload.data.password,
      phoneNumber: payload.data.phoneNumber,
      provinces: selectedProvince.name,
      cities: selectedCity.name,
      address: payload.data.address,
    }

    console.log('Sending teacher register request with token:', invitationToken)
    const response = await authApi.register(registerData, invitationToken)

    console.log('Register response:', response)

    // Check if response exists (success case)
    if (response) {
      // Response sukses bisa berupa response.success === true atau langsung data
      const isSuccess = response.status === 201 || response.status === 200

      if (isSuccess) {
        // Clear saved form data from localStorage
        clearFormFromStorage(STORAGE_KEY)

        toast.add({
          title: 'Registrasi Pengajar Berhasil',
          description: response.message || 'Akun Anda telah dibuat. Silakan login.',
          color: 'success',
          icon: 'i-lucide-check-circle',
        })

        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push(`/auth/login?email=${encodeURIComponent(payload.data.email)}`)
        }, 1500)
      } else {
        throw new Error(response.message || 'Registrasi gagal')
      }
    }
  } catch (error: any) {
    console.error('Teacher registration error:', error)

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

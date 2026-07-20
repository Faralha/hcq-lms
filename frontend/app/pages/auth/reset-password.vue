<template>
  <UPageCard class="max-w-md p-4">
    <div class="py-6 items-center justify-center flex">
      <img src="/hcq.png" class="h-12 w-auto" />
    </div>

    <!-- If no token, ask for email (to send change password magic link) -->
    <div v-if="!token" class="">
      <h1 class="text-2xl font-bold mb-2">Reset Password</h1>
      <p class="text-lg text-muted mb-6">
        Masukkan email Anda untuk menerima tautan reset password.</p>
      <AuthResetPasswordEmail />
    </div>

    <!-- If token is being validated, show loading state -->
    <div v-else-if="isValidating">
      <div class="flex flex-col items-center justify-center space-y-4 py-12">
        <p class="text-lg text-muted">Memvalidasi token...</p>
      </div>
    </div>

    <!-- If token is valid -->
    <div v-else-if="isTokenValid">
      <AuthResetPasswordModal />
    </div>

    <!-- If token is invalid -->
    <div v-else class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="bg-error mx-auto mb-4 h-20 w-20 text-primary" />
      <h2 class="mb-2 text-2xl font-bold">Token Tidak Valid</h2>
      <p class="px-4">
        Token reset password yang Anda gunakan tidak valid atau telah kedaluwarsa.
        Silakan ajukan permintaan reset password baru.</p>
      <UButton @click="submitEmail" label="Ajukan Permintaan Baru" class="w-full mt-6" size="lg" :ui="{base: 'justify-center'}" />
    </div>


    <!-- Footer -->
    <div class="items-center flex flex-col w-full">
      <div class="text-sm text-center text-muted mt-2">
        <NuxtLink to="/auth/login" class="text-primary-600 hover:underline">
          Masuk
        </NuxtLink>
        &nbsp;atau&nbsp;
        <NuxtLink to="/auth/register" class="text-primary-600 hover:underline">
          Daftar
        </NuxtLink>
      </div>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  ssr: false
})
const route = useRoute();
const token = route.query.token as string;
const toast = useToast();

// Fetch composable
const { validateResetToken } = useAuthApi();

// States
const isTokenValid = ref(false);
const isValidating = ref(false);

async function validateToken() {
  isValidating.value = true;

  if (!token) {
    isTokenValid.value = false;
    isValidating.value = false;
    return;
  }

  try {
    const response = await validateResetToken(token);
    if (response.status >= 200 && response.status < 300 && response.data) {
      isTokenValid.value = response.data.valid;
      // console.log('[AUTH] Reset token is valid:', response.data);
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Terjadi kesalahan saat memvalidasi token reset password',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isValidating.value = false;
  }
}

async function submitEmail() {
  
}

onMounted(() => {
  validateToken();
});
</script>
<template>
  <div>
    <Header />
    <slot />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'pengajar'],
  ssr: false,
})
</script>

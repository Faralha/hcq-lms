<template>
  <div>
    <Header />
    <slot />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'pelajar'],
  ssr: false,
})
</script>

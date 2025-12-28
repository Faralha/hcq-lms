<template>
  <div class="space-y-3 px-6 py-6 bg-default border border-default rounded-[10px]">
    <h2 v-if="title" class="mt-2 ml-2 text-2xl font-semibold">{{ title }}</h2>
    <div class="md:grid md:grid-cols-3">
      <template v-for="(item, index) in items" :key="item.to || index">
        <NuxtLink :to="item.to" class="rounded-[10px] block transition-colors hover:bg-elevated ">
          <UPageCard :icon="item.icon" :title="item.label" :description="item.description" variant="ghost" />
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface MenuItem {
  label: string
  description?: string
  icon?: string
  to: string
}

interface Props {
  items: MenuItem[]
  title?: string
}

defineProps<Props>()
</script>

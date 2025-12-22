<template>
  <div class="space-y-3">
    <h2 v-if="title" class="text-2xl font-semibold">{{ title }}</h2>
    <div class="border border-default rounded-[10px] overflow-hidden md:grid md:grid-cols-3">
      <template v-for="(item, index) in items" :key="item.to || index">
        <NuxtLink :to="item.to" class="border border-default block transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
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

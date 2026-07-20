<template>
  <footer class="">
    <div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Logo Section -->
        <div class="space-y-3">
          <div>
            <img :src="footerData.logo.image" class="h-14 w-auto" :alt="footerData.logo.subtitle" />
            <p class="text-sm max-w-[20rem] md:max-w-[25rem] mt-2 text-[--ui-text-muted]">{{ footerData.logo.subtitle }}</p>
          </div>
        </div>

        <!-- Dynamic Sections -->
        <div 
          v-for="(section, index) in footerData.sections" 
          :key="index"
          class="space-y-3"
        >
          <h4 class="text-sm font-semibold uppercase tracking-wider">{{ section.title }}</h4>
          
          <div class="space-y-2">
            <template v-for="(item, itemIndex) in section.items" :key="itemIndex">
              <!-- Link type -->
              <a 
                v-if="item.type === 'link' && item.link"
                :href="item.link"
                :target="item.link.startsWith('http') ? '_blank' : undefined"
                :rel="item.link.startsWith('http') ? 'noopener noreferrer' : undefined"
                class="transition-colors duration-200 block hover:underline"
              >
                {{ item.text }}
              </a>
              
              <!-- Text type -->
              <p 
                v-else-if="item.type === 'text'"
                class="leading-relaxed"
              >
                {{ item.text }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-12 pt-8 border-t border-neutral-800 text-center">
        <p class="text-sm">
          © {{ currentYear }} {{ footerData.logo.alt }}. {{ footerData.copyright }}
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import footerConfig from '~/config/footer.json'
import type { FooterConfig } from '~/types/footer'

const footerData = ref<FooterConfig>(footerConfig as FooterConfig)
const currentYear = new Date().getFullYear()
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

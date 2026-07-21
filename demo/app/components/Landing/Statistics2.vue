<template>
  <section class=" h-auto py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <ClientOnly>
          <div v-for="item in counters" :key="item.id" class="text-center md:text-left">
            <div class="space-y-2">
              <div class="text-5xl md:text-6xl lg:text-7xl font-bold">
                <span>{{ item.rounded }}</span>
                <span v-if="item.suffix">{{ item.suffix }}</span>
              </div>
              <p class="text-lg md:text-xl font-medium opacity-70">
                {{ item.label }}
              </p>
            </div>
          </div>
        </ClientOnly>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { animate } from 'motion-v';
import statsConfig from '~/config/statistics2.json';

// Definisikan statistika yang ingin ditampilkan
// Definisikan di config, biar lebih gampang (nggak usah nyari ke komponen)
const targets = statsConfig;

// Generate counter secara dinamis
const counters = reactive(targets.map(target => ({
  ...target,
  rounded: 0,
})))

let controls: any[] = []

onMounted(() => {
  controls = counters.map(counter =>
    animate(0, counter.end, {
      duration: counter.duration,
      onUpdate: (latest) => {
        counter.rounded = Math.round(latest)
      },
    })
  )
})

onUnmounted(() => {
  controls.forEach(control => control?.stop())
})
</script>
<template>
  <section class=" h-auto py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <div 
          v-for="(stat, index) in statsData.stats" 
          :key="index"
          class="text-center md:text-left"
        >
          <div class="space-y-2">
            <div class="text-5xl md:text-6xl lg:text-7xl font-bold">
              <span ref="counterRefs">{{ displayValues[index] }}</span>
              <span v-if="stat.suffix">{{ stat.suffix }}</span>
            </div>
            <p class="text-lg md:text-xl font-medium opacity-70">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import statsConfig from '~/config/statistics.json'

interface Stat {
  label: string
  value: number
  suffix?: string
}

interface StatsConfig {
  stats: Stat[]
}

const statsData = ref<StatsConfig>(statsConfig as StatsConfig)
const displayValues = ref<number[]>(statsData.value.stats.map(() => 0))
const counterRefs = ref<HTMLElement[]>([])
const hasAnimated = ref(false)

const animateCounter = (index: number, target: number, duration: number = 2000) => {
  const startTime = Date.now()
  const startValue = 0

  const updateCounter = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    displayValues.value[index] = Math.floor(startValue + (target - startValue) * easeOutQuart)

    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    } else {
      displayValues.value[index] = target
    }
  }

  requestAnimationFrame(updateCounter)
}

const startAnimation = () => {
  if (hasAnimated.value) return
  
  statsData.value.stats.forEach((stat, index) => {
    // Stagger the animation start for each stat
    setTimeout(() => {
      animateCounter(index, stat.value)
    }, index * 200)
  })
  
  hasAnimated.value = true
}

onMounted(() => {
  // Use Intersection Observer to trigger animation when component is visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAnimation()
          observer.disconnect()
        }
      })
    },
    { threshold: 0.3 }
  )

  // Observe the first counter element
  if (counterRefs.value[0]) {
    observer.observe(counterRefs.value[0])
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

<template>
    <div class="relative h-160 overflow-hidden">
    <!-- Background Image -->
    <NuxtImg
      src="landing.webp"
      alt="Landing Background portraying students learning Qur'an"
      class="absolute inset-0 w-full h-full object-cover"
      preload
    />
    
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black/40"></div>
    
    <!-- Content -->
    <div class="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-7xl">
      <h1 class="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8">
        Meraih Akhirat<br />dengan Al-Qur'an.
      </h1>
      
      <NuxtLink
        to="/auth/login"
        class="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-neutral-900 bg-primary hover:bg-neutral-100 transition-colors duration-200 w-fit"
      >
        Mulai Belajar
      </NuxtLink>
    </div>
  </div>
</template>
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/image', 'motion-v/nuxt'],
  css: ['~/assets/css/main.css'],

  ssr: true,

  routeRules: {

    // Disable SSR as base
    '/**': { ssr: false },
    
    // Enable SSR for homepage
    '/': { ssr: true },

    // Also enable for About
    '/about': { ssr: true },
  },

  app: {
    head: {
      title: 'HCQ LMS',
      htmlAttrs: {
        lang: 'id',
      }
    }
  },

  spaLoadingTemplate: 'spaLoading.html',

  runtimeConfig: {
    public: {
      apiBase: '',
    }
  },

  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  },
})
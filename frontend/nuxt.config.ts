// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/image'],
  css: ['~/assets/css/main.css'],

  ssr: false,

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
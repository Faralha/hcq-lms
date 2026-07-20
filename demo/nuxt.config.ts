// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/image', 'motion-v/nuxt'],
  css: ['~/assets/css/main.css'],

  ssr: false,
  colorMode: { preference: 'light' },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/hcq-lms/',
    head: {
      title: 'HCQ LMS - Demo',
      htmlAttrs: { lang: 'id' },
    },
  },

  spaLoadingTemplate: 'spaLoading.html',

  nitro: {
    prerender: {
      failOnError: false,
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          "~/*": ["./app/*"],
          "@/*": ["./app/*"],
        },
      },
    },
  },

  vite: {
    resolve: {
      preserveSymlinks: true,
    },
    build: {
      minify: 'esbuild',
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: process.env.NUXT_PUBLIC_API_BASE ?? 'https://dev-api.didit.ai.kr',
          changeOrigin: true,
        },
      },
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'https://api.didit.ai.kr',
      kakaoJsKey: process.env.NUXT_PUBLIC_KAKAO_JS_KEY ?? '',
      kakaoRestKey: process.env.NUXT_PUBLIC_KAKAO_REST_KEY ?? '',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      appleClientId: process.env.NUXT_PUBLIC_APPLE_CLIENT_ID ?? '',
    },
  },

  app: {
    head: {
      title: 'didit',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'theme-color', content: '#ffffff' },
      ],
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },

  vite: {
    optimizeDeps: {
      include: ['firebase/app', 'firebase/messaging'],
    },
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
      amplitudeApiKey: process.env.NUXT_PUBLIC_AMPLITUDE_API_KEY ?? '',
      // 웹 FCM (Firebase Cloud Messaging) — 웹 config/VAPID는 공개키라 커밋 무방(클라이언트 번들에 어차피 노출).
      // env로 덮어쓸 수 있고, 없으면 아래 기본값(didit-bd2f1) 사용 → 배포 시 env 미설정이어도 동작.
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyASjnqAWkt2CSYxJ4V0SklyhqBsoCCCF-4',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'didit-bd2f1.firebaseapp.com',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'didit-bd2f1',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'didit-bd2f1.firebasestorage.app',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_SENDER_ID ?? '370858550739',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '1:370858550739:web:d89f5c9a7cc098147abb26',
        vapidKey:
          process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY ??
          'BO1LKIuToukD0zFBbpmUVFKiCdBj8dzQNkDPIUSlIwPCWrkiJS5ssG5SyrldjRm6yJe4yIizKSdlAmjKmnCh5nY',
      },
    },
  },

  app: {
    head: {
      title: 'didit',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'theme-color', content: '#ffffff' },
        // 모바일 브라우저가 이메일·전화번호 등을 자동 링크(밑줄)로 인식하지 않도록
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
      ],
      link: [
        { rel: 'preload', as: 'image', href: '/icon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
})

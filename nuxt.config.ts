import pkg from './package.json'

const apiBase = process.env.NUXT_PUBLIC_API_BASE

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  components: false,
  vite: {
    optimizeDeps: {
      include: ['firebase/app', 'firebase/messaging'],
      // dotLottie 플레이어는 wasm/worker를 런타임에 로드 — 사전 번들링에서 제외해야 경로가 깨지지 않음
      exclude: ['@lottiefiles/dotlottie-web'],
    },
    build: {
      // 프로덕션 빌드(nuxt build/generate)에서 node_modules 의존성만 하나의 vendor 청크로 합치고,
      // 페이지/컴포넌트는 Nuxt 기본 라우트별 lazy 분할을 그대로 유지한다.
      // (한때 전체를 한 파일로 합쳤었는데, components: false라 컴포넌트마다 직접 import해야 하는
      // 이 프로젝트 특성상 그러면 어떤 페이지에서 import 하나만 고쳐도 앱 전체의 첫 로딩 용량이
      // 계속 커지는 문제가 있어 되돌림 — 페이지별로만 커지게 분리)
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) return 'vendor'
          },
        },
      },
      // vendor 청크는 라이브러리를 다 모아서 기본 500KB 경고 기준을 넘는 게 정상이라 기준만 올림.
      // 페이지별 청크는 전부 수십 KB대라, 이 값을 올려도 실제로 비대해진 페이지를 가릴 위험은 없다.
      chunkSizeWarningLimit: 1000,
    },
    server: {
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          // Spring validates the forwarded Origin header even though the browser
          // sends this request to the same-origin Vite proxy.
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin')
            })
          },
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

  // 사용하는 아이콘을 클라이언트 번들에 포함 — 외부 API 요청 없이 즉시 렌더 (전송 화살표 등 간헐 미표시 방지)
  icon: {
    clientBundle: { scan: true },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'https://api.didit.io.kr',
      // 웹에서 표시할 앱 버전 (앱은 @capacitor/app로 네이티브 버전을 동적으로 읽음)
      appVersion: pkg.version,
      kakaoJsKey: process.env.NUXT_PUBLIC_KAKAO_JS_KEY ?? '',
      kakaoRestKey: process.env.NUXT_PUBLIC_KAKAO_REST_KEY ?? '',
      // 네이티브 앱 키 (앱 빌드에 박히는 공개키 — 커밋 무방). 네이티브 카카오 로그인용.
      kakaoNativeKey: process.env.NUXT_PUBLIC_KAKAO_NATIVE_KEY ?? 'a2d60240a516c8296d6506cad6ae841b',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      appleClientId: process.env.NUXT_PUBLIC_APPLE_CLIENT_ID ?? '',
      appleLoginEnabled: process.env.NUXT_PUBLIC_APPLE_LOGIN_ENABLED === 'true',
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#ffffff' },
        // 모바일 브라우저가 이메일·전화번호 등을 자동 링크(밑줄)로 인식하지 않도록
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
      ],
      link: [
        { rel: 'preload', as: 'image', href: '/icon.png' },
        // Pretendard 로컬 폰트 preload — 콜드 스타트에 폴백 폰트로 렌더됐다가 바뀌는 깜빡임 방지
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/PretendardVariable.woff2', crossorigin: '' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
})

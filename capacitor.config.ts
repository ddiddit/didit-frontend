import type { CapacitorConfig } from '@capacitor/cli'

// Capacitor 패키징 설정 (Nuxt 정적 빌드를 iOS/Android 네이티브로 감쌈)
// ⚠️ appId(번들 ID)는 기존 iOS 앱·Firebase 등록 식별자와 반드시 일치시켜야 함
const config: CapacitorConfig = {
  appId: 'kr.ai.didit',
  appName: 'didit',
  // `npm run generate` 산출물 경로 (Nuxt 정적 빌드)
  webDir: '.output/public',
  plugins: {
    // 앱 내 HTTP 요청을 네이티브 계층으로 보내 WebView CORS 우회
    // (origin이 https://localhost 라 백엔드 CORS에 막히는 문제 해결)
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config

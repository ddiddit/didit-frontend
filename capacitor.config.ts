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
    // 상태바: 앱 배경색(bg-background, #F6F6F6)에 맞춰 통일.
    // 투명 오버레이 + 밝은 배경용 어두운 아이콘 (런타임 status-bar.client.ts와 동일값)
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#F6F6F6',
    },
    // 안드로이드: 키보드가 뜨면 WebView 자체를 줄임(adjustResize).
    // - none + JS 축소 방식은 레이아웃 높이와 가시 영역의 차이만큼 팬(스크롤)이 가능해져
    //   위로 당기면 빈 공간이 드러나는 문제가 있어 body로 전환.
    // - resizeOnFullScreen: 상태바 투명 오버레이(edge-to-edge)에선 adjustResize가
    //   무시되는 안드로이드 이슈 우회 옵션.
    // iOS: 런타임에 setResizeMode('none')으로 되돌려 기존 JS(visualViewport) 방식 유지
    //   (app/plugins/keyboard.client.ts)
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config

// 네이티브 앱 상태바를 앱 배경색·아이콘 톤에 맞춰 통일한다.
// - 웹뷰가 상태바 아래까지 그리도록(edge-to-edge) 설정 → #app-container의 safe-top 패딩이
//   인셋을 확보하고, 상태바 영역은 앱 배경색(bg-background, #F6F6F6)으로 자연스럽게 채워진다.
// - 밝은 배경이므로 시간·배터리 등 아이콘은 어둡게(Style.Light) 표시한다.
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  // Android: 상태바를 투명 오버레이로 → 웹뷰 배경색이 그대로 비침 (iOS는 기본 오버레이라 무영향)
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {})
  // 밝은 배경(#F6F6F6) → 어두운 아이콘
  StatusBar.setStyle({ style: Style.Light }).catch(() => {})
})

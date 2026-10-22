// 키보드 리사이즈 모드 플랫폼 분기
// - 안드로이드: capacitor.config의 resize 'body'(adjustResize) 그대로 사용 → 키보드가 뜨면
//   WebView 자체가 줄어들어 팬(빈 공간 노출) 문제가 없음
// - iOS: 검증된 기존 방식(none + 화면별 JS 축소) 유지를 위해 런타임에 none으로 되돌림
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

export default defineNuxtPlugin(() => {
  if (Capacitor.getPlatform() !== 'ios') return
  Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
  // [iOS] WebView(UIScrollView) 자체의 스크롤을 잠근다 — 장문 입력 중 커서를 보이게 하려고 WKWebView가
  // 네이티브 스크롤뷰를 위로 밀어 헤더·디딧 말풍선이 화면 밖으로 나가던 문제 방지.
  // 이 스크롤은 JS(window.scrollTo)로는 되돌릴 수 없어 네이티브에서 contentOffset을 항상 0으로 고정한다.
  // 모든 화면은 #app-container(h-dvh, overflow-clip) 안쪽 요소에서만 스크롤하므로 문서 스크롤이 필요 없다
  Keyboard.setScroll({ isDisabled: true }).catch(() => {})
})

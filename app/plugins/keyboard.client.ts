// 키보드 리사이즈 모드 플랫폼 분기
// - 안드로이드: capacitor.config의 resize 'body'(adjustResize) 그대로 사용 → 키보드가 뜨면
//   WebView 자체가 줄어들어 팬(빈 공간 노출) 문제가 없음
// - iOS: 검증된 기존 방식(none + 화면별 JS 축소) 유지를 위해 런타임에 none으로 되돌림
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

export default defineNuxtPlugin(() => {
  if (Capacitor.getPlatform() !== 'ios') return
  Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
})

// WebView 텍스트 배율을 디자인 기준(100%)으로 고정
// 안드로이드 WebView는 시스템 글꼴 크기를 textZoom으로 반영해(예: 110%)
// 기기 설정에 따라 문구가 시안과 다르게 줄바꿈되는 문제가 있어 항상 1로 고정한다.
import { Capacitor } from '@capacitor/core'
import { TextZoom } from '@capacitor/text-zoom'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return
  // 구버전 앱 바이너리엔 플러그인이 없을 수 있어 실패는 무시
  TextZoom.set({ value: 1 }).catch(() => {})
})

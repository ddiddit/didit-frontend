// 네이티브 앱 상태바를 "현재 화면의 실제 배경색"에 자동으로 통일한다.
// - 웹뷰를 상태바 아래까지 그리고(edge-to-edge), 상태바 영역(=#app-container의 safe-top 패딩)을
//   현재 화면 최상단 배경색으로 칠해 화면과 이어지게 한다.
// - 배경 밝기를 계산해 아이콘(시간·배터리) 톤을 자동 전환한다. (어두운 배경 → 밝은 아이콘)
// 화면별 색 지정이 필요 없다 — 어떤 페이지든 그 배경색을 그대로 따라간다.
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export default defineNuxtPlugin((nuxtApp) => {
  if (!Capacitor.isNativePlatform()) return

  // Android: 상태바 투명 오버레이 (iOS는 기본 오버레이라 무영향)
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {})

  const getContainer = () => document.getElementById('app-container')

  // 상태바 바로 아래 지점의 실제 배경색을 DOM에서 읽어온다 (투명이면 부모로 거슬러 올라감)
  function sampleTopColor(): [number, number, number] | null {
    const container = getContainer()
    if (!container) return null
    const inset = parseFloat(getComputedStyle(container).paddingTop) || 0
    let el: Element | null = document.elementFromPoint(Math.floor(window.innerWidth / 2), inset + 2)
    while (el) {
      const m = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (m && (m[4] === undefined || Number(m[4]) > 0)) {
        return [Number(m[1]), Number(m[2]), Number(m[3])]
      }
      el = el.parentElement
    }
    return null
  }

  function syncStatusBar() {
    const container = getContainer()
    // 이전 화면 색 잔상 제거 후 샘플링 (페이지 배경이 투명하면 기본 배경색으로 폴백)
    if (container) container.style.backgroundColor = ''
    const rgb = sampleTopColor()
    if (!rgb) return
    const [r, g, b] = rgb
    const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
    // 상태바 영역(패딩)도 같은 색으로 → 화면과 자연스럽게 이어짐
    if (container) container.style.backgroundColor = hex
    StatusBar.setBackgroundColor({ color: hex }).catch(() => {})
    // 인지 밝기(0~255) < 150 이면 어두운 배경 → 밝은 아이콘
    const dark = (r * 299 + g * 587 + b * 114) / 1000 < 150
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {})
  }

  // 페이지 전환 완료·최초 마운트 후 한 프레임 뒤 동기화 (렌더 반영 대기)
  nuxtApp.hook('page:finish', () => { requestAnimationFrame(syncStatusBar) })
  nuxtApp.hook('app:mounted', () => { requestAnimationFrame(syncStatusBar) })
})

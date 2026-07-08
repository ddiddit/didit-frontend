// 네이티브 앱 상·하단 시스템 바를 "현재 화면의 실제 배경색"에 자동으로 통일한다.
// - 상단 상태바: @capacitor/status-bar 오버레이 + safe-top 패딩을 최상단 배경색으로 칠함
// - 하단 내비게이션 바: 커스텀 NavigationBar 플러그인으로 최하단 배경색을 칠함
//   (예: 로그인/스플래시(초록) → 초록, 탭바 화면(흰색) → 흰색)
// - 각 바의 배경 밝기를 계산해 아이콘/버튼 톤을 자동 전환한다. (어두운 배경 → 밝은 아이콘)
// 화면별 색 지정이 필요 없다 — 어떤 페이지든 그 배경색을 그대로 따라간다.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// 커스텀 하단 내비바 플러그인 (android 네이티브)
interface NavigationBarPlugin {
  setColor(options: { color: string; darkButtons: boolean }): Promise<void>
}
const NavigationBar = registerPlugin<NavigationBarPlugin>('NavigationBar')

export default defineNuxtPlugin((nuxtApp) => {
  if (!Capacitor.isNativePlatform()) return
  const isAndroid = Capacitor.getPlatform() === 'android'

  // Android: 상태바 투명 오버레이 (iOS는 기본 오버레이라 무영향)
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {})

  const getContainer = () => document.getElementById('app-container')

  // 인지 밝기(0~255). 150 미만이면 어두운 배경으로 간주.
  const isDarkBg = (r: number, g: number, b: number) => (r * 299 + g * 587 + b * 114) / 1000 < 150
  const toHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`

  // 특정 y 지점의 실제 배경색을 DOM에서 읽어온다 (투명이면 부모로 거슬러 올라감)
  function sampleColorAt(y: number): [number, number, number] | null {
    let el: Element | null = document.elementFromPoint(Math.floor(window.innerWidth / 2), y)
    while (el) {
      const m = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (m && (m[4] === undefined || Number(m[4]) > 0)) {
        return [Number(m[1]), Number(m[2]), Number(m[3])]
      }
      el = el.parentElement
    }
    return null
  }

  function syncSystemBars() {
    const container = getContainer()
    // 이전 화면 색 잔상 제거 후 샘플링
    if (container) container.style.backgroundColor = ''

    // 상단 상태바 — safe-top 패딩 바로 아래 지점 색
    const topInset = container ? parseFloat(getComputedStyle(container).paddingTop) || 0 : 0
    const top = sampleColorAt(topInset + 2)
    if (top) {
      const [r, g, b] = top
      const hex = toHex(r, g, b)
      // 상태바 영역(패딩)도 같은 색으로 → 화면과 자연스럽게 이어짐
      if (container) container.style.backgroundColor = hex
      StatusBar.setBackgroundColor({ color: hex }).catch(() => {})
      StatusBar.setStyle({ style: isDarkBg(r, g, b) ? Style.Dark : Style.Light }).catch(() => {})
    }

    // 하단 내비게이션 바
    if (isAndroid) {
      // 탭바가 있는 화면은 무조건 흰색(탭바 bg-white와 이음새). 그 외엔 화면 배경색을 샘플링.
      if (document.getElementById('bottom-tab-bar')) {
        NavigationBar.setColor({ color: '#FFFFFF', darkButtons: true }).catch(() => {})
      } else {
        const bottom = sampleColorAt(window.innerHeight - 2)
        if (bottom) {
          const [r, g, b] = bottom
          NavigationBar.setColor({ color: toHex(r, g, b), darkButtons: !isDarkBg(r, g, b) }).catch(() => {})
        }
      }
    }
  }

  // 페이지 전환 완료·최초 마운트 후 한 프레임 뒤 동기화 (렌더 반영 대기)
  nuxtApp.hook('page:finish', () => { requestAnimationFrame(syncSystemBars) })
  nuxtApp.hook('app:mounted', () => { requestAnimationFrame(syncSystemBars) })
})

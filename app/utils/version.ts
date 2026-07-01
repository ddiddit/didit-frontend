import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

// 스토어 URL (강제 업데이트 시 이동)
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=kr.ai.didit'
const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6761548843'

// 시맨틱 버전 비교 — current가 minimum보다 낮으면 true (예: 1.0.0 < 1.2.0)
export function isVersionLower(current: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0)
  const c = parse(current)
  const m = parse(minimum)
  const len = Math.max(c.length, m.length)
  for (let i = 0; i < len; i += 1) {
    const cv = c[i] ?? 0
    const mv = m[i] ?? 0
    if (cv < mv) return true
    if (cv > mv) return false
  }
  return false
}

// 현재 앱 버전 — 네이티브는 빌드 versionName, 웹은 package.json 버전(fallback)
export async function getCurrentAppVersion(fallback: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo()
      return info.version
    } catch {
      // 실패 시 fallback 사용
    }
  }
  return fallback
}

// 플랫폼별 스토어로 이동 (강제 업데이트용)
export function openAppStore(): void {
  const url = Capacitor.getPlatform() === 'ios' ? APP_STORE_URL : PLAY_STORE_URL
  window.open(url, '_blank')
}

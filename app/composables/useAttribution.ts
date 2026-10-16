import {
  isSameCampaignAttribution,
  parseCampaignAttribution,
  resolveCampaignAttribution,
  restoreCampaignAttribution,
} from '~/analytics/attribution'

const STORAGE_KEY = 'campaignAttribution'

export function useAttribution() {
  const current = useState('analytics:campaign-attribution', () => {
    if (!import.meta.client) return null
    try {
      return restoreCampaignAttribution(localStorage.getItem(STORAGE_KEY))
    }
    catch {
      return null
    }
  })

  if (import.meta.client) {
    try {
      current.value = resolveCampaignAttribution(current.value, localStorage.getItem(STORAGE_KEY))
    }
    catch {
      // 저장소 접근 실패 시 현재 메모리 상태를 유지한다.
    }
  }

  function capture(url: string, options: { ignoreDuplicate?: boolean } = {}) {
    const next = parseCampaignAttribution(url)
    if (!next) return null
    if (options.ignoreDuplicate && isSameCampaignAttribution(current.value, next)) return null
    current.value = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    catch {
      // 메모리 귀속 정보로 현재 실행은 계속 추적한다.
    }
    return next
  }

  function properties() {
    const value = restoreCampaignAttribution(current.value ? JSON.stringify(current.value) : null)
    if (!value) {
      current.value = null
      if (import.meta.client) {
        try {
          localStorage.removeItem(STORAGE_KEY)
        }
        catch {
          // 분석 저장소 정리 실패는 사용자 흐름과 분리한다.
        }
      }
      return {}
    }
    const { captured_at_ms: _, expires_at_ms: __, ...properties } = value
    return properties
  }

  function clear() {
    current.value = null
    if (import.meta.client) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      }
      catch {
        // 분석 저장소 정리 실패는 사용자 흐름과 분리한다.
      }
    }
  }

  return { current, capture, properties, clear }
}

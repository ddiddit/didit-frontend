import { parseCampaignAttribution, restoreCampaignAttribution } from '~/analytics/attribution'

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

  function capture(url: string) {
    const next = parseCampaignAttribution(url)
    if (!next) return null
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

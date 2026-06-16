import * as amplitude from '@amplitude/analytics-browser'

export function useAmplitude() {
  function track(eventName: string, properties?: Record<string, unknown>) {
    amplitude.track(eventName, properties)
  }

  function identify(accessToken: string, extraProps?: Record<string, unknown>) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userId = payload.sub as string | undefined
      if (userId) amplitude.setUserId(userId)
    } catch {
      // JWT 파싱 실패 시 익명 세션 유지
    }

    if (!extraProps) return
    const identifyObj = new amplitude.Identify()
    Object.entries(extraProps).forEach(([key, value]) => {
      identifyObj.set(key, value as amplitude.Types.ValidPropertyType)
    })
    amplitude.identify(identifyObj)
  }

  function reset() {
    amplitude.reset()
  }

  return { track, identify, reset }
}

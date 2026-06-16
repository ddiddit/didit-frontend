import * as amplitude from '@amplitude/analytics-browser'

export function useAmplitude() {
  function track(eventName: string, properties?: Record<string, unknown>) {
    amplitude.track(eventName, properties)
  }

  // 로그인 후 유저 식별 (JWT sub 클레임 파싱)
  function identify(accessToken: string, extraProps?: Record<string, unknown>) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userId = payload.sub as string | undefined
      if (userId) amplitude.setUserId(userId)
    } catch {
      // JWT 파싱 실패 시 익명 세션 유지
    }

    if (extraProps) {
      const identifyObj = new amplitude.Identify()
      Object.entries(extraProps).forEach(([key, value]) => {
        identifyObj.set(key, value as amplitude.Types.ValidPropertyType)
      })
      amplitude.identify(identifyObj)
    }
  }

  // 로그아웃 시 세션 초기화
  function reset() {
    amplitude.reset()
  }

  return { track, identify, reset }
}

import * as amplitude from '@amplitude/analytics-browser'
import { Capacitor } from '@capacitor/core'
import type {
  AnalyticsCommonProperties,
  AnalyticsEventName,
  AnalyticsEventProperties,
  AppSurface,
} from '~/analytics/events'

export function useAmplitude() {
  const config = useRuntimeConfig()
  const { profile } = useProfile()

  function commonProperties(): AnalyticsCommonProperties {
    return {
      environment: import.meta.dev ? 'development' : 'production',
      app_surface: Capacitor.getPlatform() as AppSurface,
      app_version: String(config.public.appVersion),
      account_type: profile.value?.accountType ?? 'UNKNOWN',
    }
  }

  function track(eventName: string, properties?: Record<string, unknown>) {
    return amplitude.track(eventName, { ...commonProperties(), ...properties })
  }

  // 로그아웃·탈퇴처럼 전송 직후 세션이 끊기는 이벤트용 — 전송 완료를 기다리되 최대 timeoutMs까지만.
  // SDK는 init 전 호출을 큐에 쌓아두기만 해서(dev 환경·API 키 없음) .promise가 영원히 resolve되지 않을 수 있다
  function trackAndWait(eventName: string, properties?: Record<string, unknown>, timeoutMs = 1000) {
    return Promise.race([
      track(eventName, properties).promise.catch(() => undefined),
      new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
    ])
  }

  function trackEvent<Name extends AnalyticsEventName>(
    eventName: Name,
    properties: AnalyticsEventProperties[Name],
    insertId?: string,
  ) {
    return amplitude.track(
      eventName,
      { ...commonProperties(), ...properties },
      insertId ? { insert_id: insertId } : undefined,
    )
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

  return { track, trackAndWait, trackEvent, identify, reset }
}

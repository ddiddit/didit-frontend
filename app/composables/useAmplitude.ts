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

  return { track, trackEvent, identify, reset }
}

import * as amplitude from '@amplitude/analytics-browser'

export default defineNuxtPlugin(() => {
  if (import.meta.dev) return

  const config = useRuntimeConfig()
  const apiKey = config.public.amplitudeApiKey as string

  if (!apiKey) return

  amplitude.init(apiKey, {
    autocapture: false,
    defaultTracking: false,
  })

  // 토큰 자동 로그인(세션 복원) 시에도 유저를 식별해 리텐션 집계가 끊기지 않도록 보강.
  // SDK가 userId를 자체 저장하지만, 스토리지가 비어있는 기기에서는 로그인 전까지 익명이 되는 것을 방지.
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userId = payload.sub as string | undefined
      if (userId) amplitude.setUserId(userId)
    } catch {
      // JWT 파싱 실패 시 익명 세션 유지
    }
  }
})

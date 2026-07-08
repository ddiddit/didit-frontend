import { createApiClient } from '~/utils/axios'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // 네이티브 앱(WebView)은 dev(라이브 리로드)에서도 절대 URL 사용 → CapacitorHttp가 CORS를 네이티브로 우회.
  // (상대 URL이면 Vite 프록시가 폰의 Origin을 그대로 백엔드에 전달해 CORS 403으로 거부됨)
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  const isNativeApp = cap?.isNativePlatform?.() ?? false
  // 웹 개발 환경에서만 빈 baseURL → Vite 프록시(/api → dev-api)가 CORS 우회
  const baseURL = import.meta.dev && !isNativeApp ? '' : config.public.apiBase
  const api = createApiClient(baseURL)

  return {
    provide: { api },
  }
})

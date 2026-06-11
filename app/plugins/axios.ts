import { createApiClient } from '~/utils/axios'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // 개발 환경에서는 빈 baseURL → Vite 프록시(/api → dev-api)가 CORS 우회
  // 프로덕션에서는 전체 URL 사용
  const baseURL = import.meta.dev ? '' : config.public.apiBase
  const api = createApiClient(baseURL)

  return {
    provide: { api },
  }
})

import { createApiClient } from '~/utils/axios'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const api = createApiClient(config.public.apiBase)

  return {
    provide: { api },
  }
})

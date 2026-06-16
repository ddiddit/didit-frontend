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
})

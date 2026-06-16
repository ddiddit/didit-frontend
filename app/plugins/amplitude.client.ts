import * as amplitude from '@amplitude/analytics-browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiKey = config.public.amplitudeApiKey as string

  if (!apiKey) return

  amplitude.init(apiKey, {
    autocapture: false,
    defaultTracking: false,
  })
})

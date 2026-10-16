import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(async () => {
  const analytics = useRetrospectiveAnalytics()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') analytics.resume()
    else analytics.pause()
  })

  if (Capacitor.isNativePlatform()) {
    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) analytics.resume()
      else analytics.pause()
    })
  }
})

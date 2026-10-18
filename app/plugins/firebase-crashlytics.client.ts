import { Capacitor } from '@capacitor/core'
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message
  if (typeof error === 'string') return error
  return 'Unknown JavaScript error'
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!Capacitor.isNativePlatform()) return

  function record(error: unknown): void {
    FirebaseCrashlytics.recordException({ message: errorMessage(error) }).catch(() => {})
  }

  nuxtApp.hook('vue:error', (error) => {
    record(error)
  })

  window.addEventListener('error', (event) => {
    record(event.error ?? event.message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    record(event.reason)
  })
})

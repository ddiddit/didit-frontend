import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// 웹 FCM 푸시: 권한 요청 → 토큰 발급 → 백엔드 등록 → 포그라운드 수신.
// (네이티브 앱은 Capacitor 푸시 플러그인이 담당. 이 컴포저블은 웹 전용)
export function usePushNotifications() {
  const config = useRuntimeConfig().public.firebase
  const { $api } = useNuxtApp()
  const { show } = useToast()

  function firebaseApp() {
    const options: FirebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    }
    return getApps().length ? getApp() : initializeApp(options)
  }

  // 권한 요청 → 토큰 발급 → 백엔드 등록. 성공 시 토큰 반환.
  async function register(): Promise<string | null> {
    if (!import.meta.client) return null
    if (!config.apiKey || !config.vapidKey) {
      show('푸시 설정이 누락됐어요.')
      return null
    }
    if (!(await isSupported())) {
      show('이 브라우저는 푸시 알림을 지원하지 않아요.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      show('알림 권한이 거부되었어요.')
      return null
    }

    try {
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const messaging = getMessaging(firebaseApp())
      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: swReg,
      })
      if (!token) return null

      // [테스트용] 토큰 출력 — Firebase 콘솔 "테스트 메시지 전송"에 붙여넣어 확인
      console.log('%c[FCM] web token →', 'color:#3DDB99;font-weight:bold', token)

      // 백엔드 등록 (deviceType WEB — 백엔드 enum에 WEB 추가 필요)
      try {
        await $api.post('/api/v1/device-tokens', { token, deviceType: 'WEB' })
      } catch {
        // 백엔드에 WEB 타입이 아직 없으면 400 → 토큰 자체는 발급됐으니 테스트엔 지장 없음
        console.warn('[FCM] device-token 등록 실패 (백엔드 WEB 타입 추가 전이면 정상)')
      }

      listenForeground()
      return token
    } catch (e) {
      console.error('[FCM] 토큰 발급 실패:', e)
      show('알림 등록에 실패했어요.')
      return null
    }
  }

  // 앱이 포그라운드(탭 활성)일 때 수신 → 토스트
  function listenForeground() {
    if (!import.meta.client) return
    isSupported().then((ok) => {
      if (!ok) return
      const messaging = getMessaging(firebaseApp())
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? '알림'
        const body = payload.notification?.body ?? ''
        show(body ? `${title} · ${body}` : title)
      })
    })
  }

  // 이미 권한 허용 상태면 토큰 재등록(앱 시작 시 호출용)
  async function syncIfGranted(): Promise<void> {
    if (!import.meta.client) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    await register()
  }

  return { register, listenForeground, syncIfGranted }
}

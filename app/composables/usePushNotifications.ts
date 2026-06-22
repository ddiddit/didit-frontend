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
  // silent=true: 앱 시작 시 자동 동기화용 — 실패/거부 토스트를 띄우지 않는다.
  async function register({ silent = false }: { silent?: boolean } = {}): Promise<string | null> {
    if (!import.meta.client) return null
    if (!config.apiKey || !config.vapidKey) {
      if (!silent) show('푸시 설정이 누락됐어요.')
      return null
    }
    if (!(await isSupported())) {
      if (!silent) show('이 브라우저는 푸시 알림을 지원하지 않아요.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      if (!silent) show('알림 권한이 거부되었어요.')
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

      // 백엔드 등록 (deviceType WEB)
      try {
        await $api.post('/api/v1/device-tokens', { token, deviceType: 'WEB' })
      } catch {
        console.warn('[FCM] device-token 등록 실패')
      }

      listenForeground()
      return token
    } catch (e) {
      console.error('[FCM] 토큰 발급 실패:', e)
      if (!silent) show('알림 등록에 실패했어요.')
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
        // 웹은 백엔드가 data 메시지로 보냄(title/body가 data에 담김). notification은 폴백.
        const title = payload.data?.title ?? payload.notification?.title ?? '알림'
        const body = payload.data?.body ?? payload.notification?.body ?? ''
        show(body || title)
      })
    })
  }

  // 앱 시작 시 호출: 서버에 저장된 푸시 동의(enabled)를 보고, 동의 상태면 권한 요청·토큰 등록을 수행한다.
  // (이미 동의한 사용자가 토글을 껐다 켜야만 권한 팝업이 뜨던 문제 해결 — 동의=true면 로그인 시 자동 반영)
  // 자동 호출이라 실패/거부 시 토스트는 띄우지 않는다(silent).
  async function syncIfConsented(): Promise<void> {
    if (!import.meta.client) return
    // 권한이 명시적으로 거부된 상태면 매 로드마다 권한 요청을 반복하지 않는다.
    if (typeof Notification === 'undefined' || Notification.permission === 'denied') return
    try {
      const res = await $api.get<{ data: { enabled: boolean } }>('/api/v1/notification-settings')
      if (res.data.data.enabled) await register({ silent: true })
    } catch {
      // 비로그인/조회 실패 시 무시
    }
  }

  return { register, listenForeground, syncIfConsented }
}

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// FCM 푸시: 권한 요청 → 토큰 발급 → 백엔드 등록 → 포그라운드 수신.
// 웹은 Firebase JS SDK, 네이티브(Android/iOS)는 Capacitor 푸시 플러그인을 사용한다.
export function usePushNotifications() {
  const config = useRuntimeConfig().public.firebase
  const { $api } = useNuxtApp()
  const { show } = useToast()

  // 현재 플랫폼에 맞는 deviceType (백엔드 /api/v1/device-tokens 식별자)
  function deviceType(): 'ANDROID' | 'IOS' | 'WEB' {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') return 'ANDROID'
    if (platform === 'ios') return 'IOS'
    return 'WEB'
  }

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

  // ── 네이티브(Capacitor) 푸시 ──
  // 포그라운드 수신/탭 리스너는 앱 생명주기 동안 한 번만 바인딩한다.
  let nativeListenersBound = false
  function bindNativeListeners() {
    if (nativeListenersBound) return
    nativeListenersBound = true
    // 앱이 포그라운드일 때 수신 → 토스트
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      const title = notification.title ?? notification.data?.title ?? '알림'
      const body = notification.body ?? notification.data?.body ?? ''
      show(body || title)
    })
    // 알림 탭 시 (필요하면 여기서 라우팅 처리)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[FCM] notification tapped:', action.notification.data)
    })
  }

  // 권한 요청 → register() → 'registration' 이벤트로 FCM 토큰 수신 → 백엔드 등록
  async function registerNative({ silent = false }: { silent?: boolean }): Promise<string | null> {
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      if (!silent) show('알림 권한이 거부되었어요.')
      return null
    }

    bindNativeListeners()

    return new Promise<string | null>((resolve) => {
      let settled = false
      PushNotifications.addListener('registration', async (token) => {
        if (settled) return
        settled = true
        // [테스트용] 토큰 출력 — Firebase 콘솔 "테스트 메시지 전송"에 붙여넣어 확인
        console.log('%c[FCM] native token →', 'color:#3DDB99;font-weight:bold', token.value)
        try {
          await $api.post('/api/v1/device-tokens', { token: token.value, deviceType: deviceType() })
        } catch {
          console.warn('[FCM] device-token 등록 실패')
        }
        resolve(token.value)
      })
      PushNotifications.addListener('registrationError', (err) => {
        if (settled) return
        settled = true
        console.error('[FCM] native registration error:', err)
        if (!silent) show('알림 등록에 실패했어요.')
        resolve(null)
      })
      PushNotifications.register()
    })
  }

  // ── 웹(Firebase JS SDK) 푸시 ──
  async function registerWeb({ silent = false }: { silent?: boolean }): Promise<string | null> {
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
        await $api.post('/api/v1/device-tokens', { token, deviceType: deviceType() })
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

  // 권한 요청 → 토큰 발급 → 백엔드 등록. 성공 시 토큰 반환.
  // silent=true: 앱 시작 시 자동 동기화용 — 실패/거부 토스트를 띄우지 않는다.
  async function register({ silent = false }: { silent?: boolean } = {}): Promise<string | null> {
    if (!import.meta.client) return null
    return Capacitor.isNativePlatform() ? registerNative({ silent }) : registerWeb({ silent })
  }

  // 웹: 앱이 포그라운드(탭 활성)일 때 수신 → 토스트
  function listenForeground() {
    if (!import.meta.client || Capacitor.isNativePlatform()) return
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
    // 웹: 권한이 명시적으로 거부된 상태면 매 로드마다 권한 요청을 반복하지 않는다.
    // (네이티브는 플러그인이 권한 상태를 직접 관리하므로 이 가드를 건너뛴다)
    if (!Capacitor.isNativePlatform()) {
      if (typeof Notification === 'undefined' || Notification.permission === 'denied') return
    }
    try {
      const res = await $api.get<{ data: { enabled: boolean } }>('/api/v1/notification-settings')
      if (res.data.data.enabled) await register({ silent: true })
    } catch {
      // 비로그인/조회 실패 시 무시
    }
  }

  return { register, listenForeground, syncIfConsented, deviceType }
}

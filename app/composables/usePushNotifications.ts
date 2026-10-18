import { Capacitor } from '@capacitor/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import {
  buildFirebaseMessagingServiceWorkerUrl,
  hasRequiredFirebaseMessagingConfig,
} from '~/utils/firebaseMessagingConfig'
import { isFirebaseNativePlatformEnabled } from '~/utils/firebaseNativePlatform'

// FCM 푸시: 권한 요청 → 토큰 발급 → 백엔드 등록 → 포그라운드 수신.
// 웹은 Firebase JS SDK, 현재 배포 대상인 iOS는 Firebase Messaging 플러그인을 사용한다.
// Android는 새 Firebase 앱과 google-services.json을 준비한 뒤 별도로 활성화한다.

// 리스너 중복 바인딩 방지 — 컴포저블이 여러 곳(app.vue·알림 설정)에서 호출돼도 앱 전체에서 1회만
let nativeListenersBound = false

// 알림 탭으로 앱이 콜드 스타트되면 딥링크가 스플래시(index.vue)의 홈 이동에 덮여 사라진다.
// 이 경우 링크를 여기 담아두고, index.vue가 인증 확인 후 consumePendingDeepLink()로 소비한다.
let pendingDeepLink: string | null = null

export function usePushNotifications() {
  const config = useRuntimeConfig().public.firebase
  const { $api } = useNuxtApp()
  const { show } = useToast()
  const router = useRouter()
  const attribution = useAttribution()
  const { trackEvent } = useAmplitude()

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

  function notificationData(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  }

  async function saveDeviceToken(token: string): Promise<void> {
    try {
      await $api.post('/api/v1/device-tokens', { token, deviceType: deviceType() })
    } catch {
      console.warn('[FCM] device-token 등록 실패')
    }
  }

  // ── 네이티브(Capacitor) 푸시 ──
  // 포그라운드 수신/탭 리스너는 앱 생명주기 동안 한 번만 바인딩한다.
  // 종료 상태에서 알림을 탭해 실행되는 경우도 잡을 수 있게 앱 시작 시(app.vue) 항상 호출된다.
  function bindNativeListeners() {
    if (!isFirebaseNativePlatformEnabled(Capacitor.getPlatform()) || nativeListenersBound) return
    nativeListenersBound = true
    // 앱이 포그라운드일 때 수신 → 토스트
    FirebaseMessaging.addListener('notificationReceived', ({ notification }) => {
      const data = notificationData(notification.data)
      const title = notification.title ?? (typeof data.title === 'string' ? data.title : '알림')
      const body = notification.body ?? (typeof data.body === 'string' ? data.body : '')
      show(body || title)
    })
    // 알림 탭 시 백엔드가 data.link로 내려준 화면으로 이동.
    // 콜드 스타트(아직 스플래시 '/')면 pendingDeepLink에 담아 index.vue가 인증 확인 후 이동하고,
    // 앱 실행 중(웜)이면 현재 라우터로 바로 이동한다.
    FirebaseMessaging.addListener('notificationActionPerformed', async (action) => {
      const data = notificationData(action.notification.data)
      const link = data.link
      if (typeof link !== 'string' || !link.startsWith('/')) return
      const campaign = attribution.capture(link)
      if (campaign) {
        await useProfile().load(true)
        trackEvent('campaign_opened', {
          ...attribution.properties(),
          entry_channel: campaign.entry_channel,
          campaign_id: campaign.campaign_id,
          link_target: new URL(link, 'https://didit.io.kr').pathname,
        })
      }
      if (router.currentRoute.value.path === '/') {
        pendingDeepLink = link
      } else {
        router.push(link)
      }
    })
    // FCM이 토큰을 갱신하면 서버에도 최신 토큰을 반영한다.
    FirebaseMessaging.addListener('tokenReceived', ({ token }) => {
      saveDeviceToken(token)
    })
  }

  // 권한 요청 → FCM 토큰 발급 → 백엔드 등록
  async function registerNative({ silent = false }: { silent?: boolean }): Promise<string | null> {
    let perm = await FirebaseMessaging.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await FirebaseMessaging.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      if (!silent) show('알림 권한이 거부되었어요.')
      return null
    }

    bindNativeListeners()

    try {
      const { token } = await FirebaseMessaging.getToken()
      console.log('%c[FCM] native token →', 'color:#3DDB99;font-weight:bold', token)
      await saveDeviceToken(token)
      return token
    } catch (error) {
      console.error('[FCM] native registration error:', error)
      if (!silent) show('알림 등록에 실패했어요.')
      return null
    }
  }

  // ── 웹(Firebase JS SDK) 푸시 ──
  async function registerWeb({ silent = false }: { silent?: boolean }): Promise<string | null> {
    if (!hasRequiredFirebaseMessagingConfig(config)) {
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
      const swReg = await navigator.serviceWorker.register(buildFirebaseMessagingServiceWorkerUrl(config))
      const messaging = getMessaging(firebaseApp())
      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: swReg,
      })
      if (!token) return null

      // [테스트용] 토큰 출력 — Firebase 콘솔 "테스트 메시지 전송"에 붙여넣어 확인
      console.log('%c[FCM] web token →', 'color:#3DDB99;font-weight:bold', token)

      // 백엔드 등록 (deviceType WEB)
      await saveDeviceToken(token)

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
    const platform = Capacitor.getPlatform()
    if (isFirebaseNativePlatformEnabled(platform)) return registerNative({ silent })
    if (platform === 'android') {
      console.warn('[FCM] Android Firebase 앱이 아직 등록되지 않아 푸시 등록을 건너뜁니다.')
      return null
    }
    return registerWeb({ silent })
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
    if (!isFirebaseNativePlatformEnabled(Capacitor.getPlatform())) {
      if (typeof Notification === 'undefined' || Notification.permission === 'denied') return
    }
    try {
      // 앱 시작·새로고침마다 재요청하지 않도록 캐시된 알림 설정을 우선 사용
      const settings = await useNotificationSettings().load()
      if (settings.enabled) await register({ silent: true })
    } catch {
      // 비로그인/조회 실패 시 무시
    }
  }

  // 스플래시(index.vue)가 인증 확인 후 호출 — 알림 탭으로 콜드 스타트된 경우 대기 중인 딥링크를 꺼내 소비한다
  function consumePendingDeepLink(): string | null {
    const link = pendingDeepLink
    pendingDeepLink = null
    return link
  }

  return { register, listenForeground, syncIfConsented, deviceType, bindNativeListeners, consumePendingDeepLink }
}

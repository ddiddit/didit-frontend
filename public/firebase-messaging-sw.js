/* 웹 FCM 백그라운드 수신 서비스 워커.
   빌드 환경변수를 직접 읽을 수 없으므로 등록 URL의 공개 설정을 사용한다. */
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js')

const params = new URL(self.location.href).searchParams

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

// 앱이 백그라운드/닫힘 상태일 때 푸시 수신 → 알림 표시
messaging.onBackgroundMessage((payload) => {
  // 제목은 앱 이름으로 고정, 멘트(본문)는 data.body 사용. notification은 폴백.
  const body = payload.data?.body || payload.notification?.body || ''
  self.registration.showNotification('디딧', {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data || {},
  })
})

// 알림 클릭 → 이미 열린 탭 포커스, 없으면 새로 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate?.(link)
          return w.focus()
        }
      }
      return clients.openWindow(link)
    }),
  )
})

/* 웹 FCM 백그라운드 수신 서비스 워커.
   서비스 워커는 빌드/환경변수에 접근 못 하므로 config를 직접 기입한다(웹 apiKey는 공개되어도 무방). */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyASjnqAWkt2CSYxJ4V0SklyhqBsoCCCF-4',
  authDomain: 'didit-bd2f1.firebaseapp.com',
  projectId: 'didit-bd2f1',
  storageBucket: 'didit-bd2f1.firebasestorage.app',
  messagingSenderId: '370858550739',
  appId: '1:370858550739:web:d89f5c9a7cc098147abb26',
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

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildFirebaseMessagingServiceWorkerUrl,
  hasRequiredFirebaseMessagingConfig,
} from '../../app/utils/firebaseMessagingConfig.ts'

const firebaseConfig = {
  apiKey: 'public-api-key',
  authDomain: 'didit-559fd.firebaseapp.com',
  projectId: 'didit-559fd',
  storageBucket: 'didit-559fd.firebasestorage.app',
  messagingSenderId: '597252114666',
  appId: '1:597252114666:web:example',
  vapidKey: 'public-vapid-key',
}

describe('Firebase Messaging 설정', () => {
  it('웹 푸시에 필요한 설정이 모두 있으면 사용할 수 있다', () => {
    assert.equal(hasRequiredFirebaseMessagingConfig(firebaseConfig), true)
  })

  it('필수 설정이 하나라도 비어 있으면 사용할 수 없다', () => {
    assert.equal(hasRequiredFirebaseMessagingConfig({ ...firebaseConfig, projectId: '' }), false)
  })

  it('서비스 워커가 동일한 Firebase 프로젝트를 사용하도록 공개 설정을 URL에 담는다', () => {
    const url = new URL(buildFirebaseMessagingServiceWorkerUrl(firebaseConfig), 'https://didit.io.kr')

    assert.equal(url.pathname, '/firebase-messaging-sw.js')
    assert.equal(url.searchParams.get('apiKey'), firebaseConfig.apiKey)
    assert.equal(url.searchParams.get('authDomain'), firebaseConfig.authDomain)
    assert.equal(url.searchParams.get('projectId'), firebaseConfig.projectId)
    assert.equal(url.searchParams.get('storageBucket'), firebaseConfig.storageBucket)
    assert.equal(url.searchParams.get('messagingSenderId'), firebaseConfig.messagingSenderId)
    assert.equal(url.searchParams.get('appId'), firebaseConfig.appId)
    assert.equal(url.searchParams.has('vapidKey'), false)
  })
})

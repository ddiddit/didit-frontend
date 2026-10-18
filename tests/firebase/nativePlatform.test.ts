import assert from 'node:assert/strict'
import test from 'node:test'
import { isFirebaseNativePlatformEnabled } from '../../app/utils/firebaseNativePlatform.ts'

test('현재 네이티브 Firebase 대상은 iOS만 허용한다', () => {
  assert.equal(isFirebaseNativePlatformEnabled('ios'), true)
  assert.equal(isFirebaseNativePlatformEnabled('android'), false)
  assert.equal(isFirebaseNativePlatformEnabled('web'), false)
})

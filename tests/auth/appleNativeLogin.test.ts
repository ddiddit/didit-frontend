import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createAppleNativeConfig, getAppleNativeCredentials } from '../../app/utils/appleNativeLogin.ts'

describe('iOS Apple 로그인 토큰 교환', () => {
  it('SDK 초기화에서 authorization code 반환을 활성화한다', () => {
    assert.deepEqual(createAppleNativeConfig('com.swyp.didit'), {
      clientId: 'com.swyp.didit',
      useProperTokenExchange: true,
    })
  })

  it('ID 토큰과 authorization code가 모두 있을 때만 백엔드 전달값을 만든다', () => {
    assert.deepEqual(
      getAppleNativeCredentials({ idToken: 'id-token', authorizationCode: 'authorization-code' }),
      { idToken: 'id-token', authorizationCode: 'authorization-code' },
    )
    assert.equal(getAppleNativeCredentials({ idToken: 'id-token' }), null)
    assert.equal(getAppleNativeCredentials({ authorizationCode: 'authorization-code' }), null)
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createAppleNativeConfig, getAppleNativeCredentials } from '../../app/utils/appleNativeLogin.ts'

describe('iOS Apple 로그인 토큰 교환', () => {
  it('iOS 7.20 플러그인의 accessToken 반환 방식을 사용한다', () => {
    assert.deepEqual(createAppleNativeConfig('com.swyp.didit'), {
      clientId: 'com.swyp.didit',
      useProperTokenExchange: false,
    })
  })

  it('ID 토큰과 authorization code가 모두 있을 때만 백엔드 전달값을 만든다', () => {
    assert.deepEqual(
      getAppleNativeCredentials({ idToken: 'id-token', authorizationCode: 'authorization-code' }),
      { idToken: 'id-token', authorizationCode: 'authorization-code' },
    )
    assert.deepEqual(
      getAppleNativeCredentials({ idToken: 'id-token', accessToken: { token: 'legacy-authorization-code' } }),
      { idToken: 'id-token', authorizationCode: 'legacy-authorization-code' },
    )
    assert.equal(getAppleNativeCredentials({ idToken: 'id-token' }), null)
    assert.equal(getAppleNativeCredentials({ authorizationCode: 'authorization-code' }), null)
  })
})

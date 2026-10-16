import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createAnalyticsInsertId } from '../../app/analytics/events.ts'

describe('analytics event identity', () => {
  it('같은 논리 이벤트는 재시도해도 같은 중복 제거 키를 만든다', () => {
    assert.equal(
      createAnalyticsInsertId('retrospect_answer_submitted', 'retro-1', 'turn-1'),
      'retrospect_answer_submitted:retro-1:turn-1',
    )
  })

  it('서로 다른 턴은 다른 중복 제거 키를 만든다', () => {
    assert.notEqual(
      createAnalyticsInsertId('retrospect_answer_submitted', 'retro-1', 'turn-1'),
      createAnalyticsInsertId('retrospect_answer_submitted', 'retro-1', 'turn-2'),
    )
  })
})

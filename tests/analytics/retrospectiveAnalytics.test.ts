import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  completeRetrospectiveAnalytics,
  createRetrospectiveAnalytics,
  pauseRetrospectiveAnalytics,
  recordSubmittedAnswer,
  restoreRetrospectiveAnalytics,
  resumeRetrospectiveAnalytics,
} from '../../app/analytics/retrospective.ts'

describe('retrospective analytics context', () => {
  it('백그라운드 시간을 제외하고 활성 시간을 누적한다', () => {
    const started = createRetrospectiveAnalytics('retro-1', 1_000)
    const paused = pauseRetrospectiveAnalytics(started, 6_000)
    const resumed = resumeRetrospectiveAnalytics(paused, 16_000)
    const completed = completeRetrospectiveAnalytics(resumed, 20_000)

    assert.equal(completed.elapsedDurationSec, 19)
    assert.equal(completed.activeDurationSec, 9)
  })

  it('같은 서버 턴을 재처리해도 답변 수를 중복 증가시키지 않는다', () => {
    const started = createRetrospectiveAnalytics('retro-1', 1_000)
    const first = recordSubmittedAnswer(started, 'turn-1')
    const duplicate = recordSubmittedAnswer(first, 'turn-1')
    const second = recordSubmittedAnswer(duplicate, 'turn-2')

    assert.equal(second.answerCount, 2)
    assert.deepEqual(second.submittedTurnIds, ['turn-1', 'turn-2'])
  })

  it('저장된 상태를 복원할 때 비정상 값은 버린다', () => {
    const valid = createRetrospectiveAnalytics('retro-1', 1_000)

    assert.deepEqual(restoreRetrospectiveAnalytics(JSON.stringify(valid)), {
      ...valid,
      activeStartedAtMs: null,
    })
    assert.equal(restoreRetrospectiveAnalytics('{broken'), null)
    assert.equal(restoreRetrospectiveAnalytics(JSON.stringify({ ...valid, answerCount: -1 })), null)
  })

  it('프로세스 재시작으로 복원하면 저장 당시 열린 활성 구간을 닫는다', () => {
    const context = createRetrospectiveAnalytics('retro-1', 1_000)

    const restored = restoreRetrospectiveAnalytics(JSON.stringify(context))

    assert.equal(restored?.activeStartedAtMs, null)
  })
})

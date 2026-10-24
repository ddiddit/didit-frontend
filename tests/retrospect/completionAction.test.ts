import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveCompletionAction } from '../../app/utils/retrospectCompletion.ts'

describe('retrospective completion action', () => {
  it('완료 가능한 회고는 결과 생성을 진행한다', () => {
    assert.equal(resolveCompletionAction(true), 'finish')
  })

  it('완료할 수 없는 회고는 저장 없이 나간다', () => {
    assert.equal(resolveCompletionAction(false), 'exit')
  })
})

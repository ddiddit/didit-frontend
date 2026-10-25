import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolveCompletionAction,
  resolveHeaderCompletionAction,
} from '../../app/utils/retrospectCompletion.ts'

describe('retrospective completion action', () => {
  it('완료 가능한 회고는 결과 생성을 진행한다', () => {
    assert.equal(resolveCompletionAction(true), 'finish')
  })

  it('완료할 수 없는 회고는 저장 없이 나간다', () => {
    assert.equal(resolveCompletionAction(false), 'exit')
  })

  it('완료 준비가 되면 헤더에서 바로 완료 확인을 띄운다', () => {
    assert.equal(resolveHeaderCompletionAction(true, false), 'finish')
  })

  it('완료 준비 전 첫 시도에는 작성 안내를 띄운다', () => {
    assert.equal(resolveHeaderCompletionAction(false, false), 'warn')
  })

  it('작성 안내를 확인한 뒤 다시 시도하면 나가기 확인을 띄운다', () => {
    assert.equal(resolveHeaderCompletionAction(false, true), 'confirm-exit')
  })
})

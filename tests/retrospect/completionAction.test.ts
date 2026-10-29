import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolveConversationCompletionAction,
  resolveHeaderCompletionAction,
  shouldShowCompletionOffer,
} from '../../app/utils/retrospectCompletion.ts'

describe('retrospective completion action', () => {
  it('완료 가능한 종료 제안에는 선택 버튼을 노출한다', () => {
    assert.equal(shouldShowCompletionOffer('OFFER_COMPLETION', true), true)
    assert.equal(shouldShowCompletionOffer('CONFIRM_COMPLETION', true), true)
  })

  it('완료할 수 없는 응답(작성 부족 안내)에는 선택 버튼을 노출하지 않는다', () => {
    assert.equal(shouldShowCompletionOffer('OFFER_COMPLETION', false), false)
    assert.equal(shouldShowCompletionOffer('CONFIRM_COMPLETION', false), false)
  })

  it('종료 제안이 아닌 응답에는 선택 버튼을 노출하지 않는다', () => {
    assert.equal(shouldShowCompletionOffer('ASK', true), false)
    assert.equal(shouldShowCompletionOffer('REFLECT', true), false)
    assert.equal(shouldShowCompletionOffer(null, true), false)
  })

  it('완료 가능한 종료 제안은 결과 생성 선택 메뉴로 해석한다', () => {
    assert.equal(resolveConversationCompletionAction('OFFER_COMPLETION', true), 'finish')
    assert.equal(resolveConversationCompletionAction('CONFIRM_COMPLETION', true), 'finish')
  })

  it('완료 불가능한 명시적 종료 요청은 결과 없는 나가기 메뉴로 해석한다', () => {
    assert.equal(resolveConversationCompletionAction('CONFIRM_EXIT', false), 'exit')
  })

  it('작성 부족 안내와 일반 질문에는 채팅 메뉴를 붙이지 않는다', () => {
    assert.equal(resolveConversationCompletionAction('REFLECT', false), null)
    assert.equal(resolveConversationCompletionAction('ASK', false), null)
    assert.equal(resolveConversationCompletionAction('OFFER_COMPLETION', false), null)
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

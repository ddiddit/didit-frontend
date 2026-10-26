import type { AssistantAction } from '~/types/api'

export type HeaderCompletionAction = 'finish' | 'warn' | 'confirm-exit'

// AI 답장 아래 '더 할래요 / 정리할게요' 선택 버튼 노출 여부.
// 종료 제안(OFFER_COMPLETION·CONFIRM_COMPLETION)이면서 결과 생성이 가능할 때만 노출한다 —
// readyToComplete=false인 응답은 '아직 결과를 만들 수 없다'는 안내라 종료 선택지를 붙이면 맥락이 맞지 않는다
export function shouldShowCompletionOffer(action: AssistantAction | null | undefined, readyToComplete: boolean): boolean {
  if (!readyToComplete) return false
  return action === 'OFFER_COMPLETION' || action === 'CONFIRM_COMPLETION'
}

export function resolveHeaderCompletionAction(
  readyToComplete: boolean,
  hasSeenInsufficientContentWarning: boolean,
): HeaderCompletionAction {
  if (readyToComplete) return 'finish'
  return hasSeenInsufficientContentWarning ? 'confirm-exit' : 'warn'
}

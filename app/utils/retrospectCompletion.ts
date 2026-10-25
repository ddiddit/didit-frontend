export type RetrospectCompletionAction = 'finish' | 'exit'
export type HeaderCompletionAction = 'finish' | 'warn' | 'confirm-exit'

export function resolveCompletionAction(readyToComplete: boolean): RetrospectCompletionAction {
  return readyToComplete ? 'finish' : 'exit'
}

export function resolveHeaderCompletionAction(
  readyToComplete: boolean,
  hasSeenInsufficientContentWarning: boolean,
): HeaderCompletionAction {
  if (readyToComplete) return 'finish'
  return hasSeenInsufficientContentWarning ? 'confirm-exit' : 'warn'
}

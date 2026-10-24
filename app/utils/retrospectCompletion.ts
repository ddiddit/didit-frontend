export type RetrospectCompletionAction = 'finish' | 'exit'

export function resolveCompletionAction(readyToComplete: boolean): RetrospectCompletionAction {
  return readyToComplete ? 'finish' : 'exit'
}

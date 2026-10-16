export interface RetrospectiveAnalyticsContext {
  retrospectiveId: string
  startedAtMs: number
  activeDurationMs: number
  activeStartedAtMs: number | null
  answerCount: number
  submittedTurnIds: string[]
}

export interface RetrospectiveAnalyticsCompletion {
  context: RetrospectiveAnalyticsContext
  elapsedDurationSec: number
  activeDurationSec: number
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function createRetrospectiveAnalytics(
  retrospectiveId: string,
  nowMs = Date.now(),
): RetrospectiveAnalyticsContext {
  return {
    retrospectiveId,
    startedAtMs: nowMs,
    activeDurationMs: 0,
    activeStartedAtMs: nowMs,
    answerCount: 0,
    submittedTurnIds: [],
  }
}

export function pauseRetrospectiveAnalytics(
  context: RetrospectiveAnalyticsContext,
  nowMs = Date.now(),
): RetrospectiveAnalyticsContext {
  if (context.activeStartedAtMs === null) return context

  return {
    ...context,
    activeDurationMs:
      context.activeDurationMs + Math.max(0, nowMs - context.activeStartedAtMs),
    activeStartedAtMs: null,
  }
}

export function resumeRetrospectiveAnalytics(
  context: RetrospectiveAnalyticsContext,
  nowMs = Date.now(),
): RetrospectiveAnalyticsContext {
  if (context.activeStartedAtMs !== null) return context
  return { ...context, activeStartedAtMs: nowMs }
}

export function recordSubmittedAnswer(
  context: RetrospectiveAnalyticsContext,
  turnId: string,
): RetrospectiveAnalyticsContext {
  if (context.submittedTurnIds.includes(turnId)) return context

  return {
    ...context,
    answerCount: context.answerCount + 1,
    submittedTurnIds: [...context.submittedTurnIds, turnId],
  }
}

export function completeRetrospectiveAnalytics(
  context: RetrospectiveAnalyticsContext,
  nowMs = Date.now(),
): RetrospectiveAnalyticsCompletion {
  const paused = pauseRetrospectiveAnalytics(context, nowMs)
  return {
    context: paused,
    elapsedDurationSec: Math.floor(Math.max(0, nowMs - paused.startedAtMs) / 1_000),
    activeDurationSec: Math.floor(paused.activeDurationMs / 1_000),
  }
}

export function restoreRetrospectiveAnalytics(
  serialized: string | null,
): RetrospectiveAnalyticsContext | null {
  if (!serialized) return null

  try {
    const value = JSON.parse(serialized) as Partial<RetrospectiveAnalyticsContext>
    if (
      typeof value.retrospectiveId !== 'string'
      || value.retrospectiveId.length === 0
      || !isNonNegativeFinite(value.startedAtMs)
      || !isNonNegativeFinite(value.activeDurationMs)
      || (value.activeStartedAtMs !== null && !isNonNegativeFinite(value.activeStartedAtMs))
      || !Number.isInteger(value.answerCount)
      || (value.answerCount ?? -1) < 0
      || !Array.isArray(value.submittedTurnIds)
      || value.submittedTurnIds.some(turnId => typeof turnId !== 'string')
      || value.answerCount !== value.submittedTurnIds.length
    ) {
      return null
    }

    return {
      ...(value as RetrospectiveAnalyticsContext),
      // 프로세스 종료 시 pause 이벤트를 받지 못했을 수 있으므로 저장된 열린 구간은 신뢰하지 않는다.
      activeStartedAtMs: null,
    }
  } catch {
    return null
  }
}

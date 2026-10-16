import {
  completeRetrospectiveAnalytics,
  createRetrospectiveAnalytics,
  pauseRetrospectiveAnalytics,
  recordSubmittedAnswer,
  restoreRetrospectiveAnalytics,
  resumeRetrospectiveAnalytics,
  type RetrospectiveAnalyticsCompletion,
  type RetrospectiveAnalyticsContext,
} from '~/analytics/retrospective'

const STORAGE_PREFIX = 'retrospectiveAnalytics:'

function storageKey(retrospectiveId: string) {
  return `${STORAGE_PREFIX}${retrospectiveId}`
}

export function useRetrospectiveAnalytics() {
  const context = useState<RetrospectiveAnalyticsContext | null>(
    'retrospect:analytics-context',
    () => null,
  )

  function persist(next: RetrospectiveAnalyticsContext | null) {
    context.value = next
    if (!next || !import.meta.client) return
    try {
      localStorage.setItem(storageKey(next.retrospectiveId), JSON.stringify(next))
    }
    catch {
      // 분석 저장 실패가 회고 제출 성공 여부에 영향을 주면 안 된다.
    }
  }

  function begin(retrospectiveId: string) {
    const next = createRetrospectiveAnalytics(retrospectiveId)
    persist(next)
    return next
  }

  function restore(retrospectiveId: string) {
    if (context.value?.retrospectiveId === retrospectiveId) {
      const next = resumeRetrospectiveAnalytics(context.value)
      persist(next)
      return next
    }

    let saved: RetrospectiveAnalyticsContext | null = null
    if (import.meta.client) {
      try {
        saved = restoreRetrospectiveAnalytics(localStorage.getItem(storageKey(retrospectiveId)))
      }
      catch {
        saved = null
      }
    }
    const next = resumeRetrospectiveAnalytics(
      saved ?? createRetrospectiveAnalytics(retrospectiveId),
    )
    persist(next)
    return next
  }

  function recordAnswer(turnId: string) {
    if (!context.value) return null
    const next = recordSubmittedAnswer(context.value, turnId)
    persist(next)
    return next
  }

  function pause() {
    if (!context.value) return
    persist(pauseRetrospectiveAnalytics(context.value))
  }

  function resume() {
    if (!context.value) return
    persist(resumeRetrospectiveAnalytics(context.value))
  }

  function completion(): RetrospectiveAnalyticsCompletion | null {
    if (!context.value) return null
    const result = completeRetrospectiveAnalytics(context.value)
    persist(result.context)
    return result
  }

  function clear(retrospectiveId: string) {
    if (context.value?.retrospectiveId === retrospectiveId) context.value = null
    if (import.meta.client) {
      try {
        localStorage.removeItem(storageKey(retrospectiveId))
      }
      catch {
        // 분석 정리 실패는 사용자 흐름과 분리한다.
      }
    }
  }

  return { context, begin, restore, recordAnswer, pause, resume, completion, clear }
}

import { toErrorVariant, isAuthError } from '~/utils/api-error'

// 페이지 데이터 로드 상태 표준화.
// - loadError: 실패 시 에러코드 기반 전체화면 에러 variant (network/server/generic)
// - slowLoading: 응답이 5초 이상 걸리면 '응답이 오래 걸리고 있어요' 배너용
// run()으로 로드 함수를 감싸면 위 상태가 자동 관리된다.
export function useLoadState() {
  const isLoading = ref(false)
  const loadError = ref<'network' | 'server' | 'generic' | null>(null)
  const slowLoading = ref(false)
  let slowTimer: ReturnType<typeof setTimeout> | null = null

  function clearSlow() {
    if (slowTimer) {
      clearTimeout(slowTimer)
      slowTimer = null
    }
    slowLoading.value = false
  }

  // keepCache: 캐시가 있어 스켈레톤 없이 갱신만 할 때 isLoading을 켜지 않음
  async function run(fn: () => Promise<void>, opts: { keepCache?: boolean } = {}): Promise<boolean> {
    loadError.value = null
    if (!opts.keepCache) isLoading.value = true
    clearSlow()
    slowTimer = setTimeout(() => { slowLoading.value = true }, 5000)
    try {
      await fn()
      return true
    } catch (e) {
      // 인증 만료는 axios 인터셉터가 로그인으로 보냄 → 에러 화면 띄우지 않음
      if (isAuthError(e)) return false
      loadError.value = toErrorVariant(e)
      return false
    } finally {
      isLoading.value = false
      clearSlow()
    }
  }

  return { isLoading, loadError, slowLoading, run }
}

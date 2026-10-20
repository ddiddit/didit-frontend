import type { ApiResponse, UserProfile } from '~/types/api'
import { CACHE_KEYS, isCacheFresh, readPersistedCache, removePersistedCache, writePersistedCache } from '~/utils/persisted-cache'

// 프로필 캐시 유효 시간 — 레벨·최근 배지는 회고 완료 시 바뀌는데 그때는 invalidateProfileCache()로 바로 무효화하므로,
// TTL은 다른 기기에서 바뀐 값(닉네임 등)을 언젠가는 반영하기 위한 안전장치
const PROFILE_TTL = 1000 * 60 * 10 // 10분

// 사용자 프로필을 SPA 전역에서 한 번만 받아 공유한다.
// (마이/계정/탈퇴/문의/프로필수정 등 여러 페이지가 각자 /api/v2/users/profile를
//  중복 호출하던 것을 캐시로 묶어 페이지 이동 시 재요청을 막는다.)
// 응답은 localStorage에도 보관해 새로고침 후에도 TTL 안이면 요청 없이 바로 쓴다.
export function useProfile() {
  const { $api } = useNuxtApp()
  const profile = useState<UserProfile | null>('user:profile', () => readPersistedCache<UserProfile>(CACHE_KEYS.profile)?.data ?? null)
  // 마지막으로 받은 시각 — 0이면 무효화된 상태(화면엔 기존 값을 그대로 쓰되 다음 load에서 새로 받음)
  const savedAt = useState<number>('user:profile:savedAt', () => readPersistedCache<UserProfile>(CACHE_KEYS.profile)?.savedAt ?? 0)

  // 동시에 여러 페이지가 load()를 호출해도 요청은 1회만 나가도록 in-flight 공유
  const inflight = useState<Promise<UserProfile | null> | null>('user:profile:inflight', () => null)

  // 캐시가 있고 TTL 안이면 그대로 사용, 없거나 오래됐을 때(또는 force=true)만 요청한다.
  async function load(force = false): Promise<UserProfile | null> {
    if (profile.value && !force && isCacheFresh({ data: null, savedAt: savedAt.value }, PROFILE_TTL)) return profile.value
    if (inflight.value && !force) return inflight.value
    inflight.value = (async () => {
      try {
        // force면 axios GET 캐시도 건너뛰고 서버에서 새로 받는다
        const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile', { cache: !force })
        setProfile(res.data.data)
      } catch {
        // 401/403은 axios 인터셉터가 처리
      } finally {
        inflight.value = null
      }
      return profile.value
    })()
    return inflight.value
  }

  // load와 달리 에러를 그대로 던진다(useLoadState.run과 함께 써서 에러 화면 분기용).
  async function reload(): Promise<UserProfile | null> {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    setProfile(res.data.data)
    return profile.value
  }

  // 화면 진입용 — 캐시가 유효하면 요청 없이 반환하고, 아니면 reload()처럼 에러를 던지며 새로 받는다
  // (useLoadState.run과 함께 써서 캐시가 없을 때만 로딩·에러 화면이 뜨게)
  async function ensure(): Promise<UserProfile | null> {
    if (profile.value && isCacheFresh({ data: null, savedAt: savedAt.value }, PROFILE_TTL)) return profile.value
    return reload()
  }

  // 프로필 조회·수정(PATCH) 후 캐시를 갱신해 다른 페이지가 재요청 없이 최신값을 쓰게 한다.
  function setProfile(p: UserProfile) {
    profile.value = p
    savedAt.value = writePersistedCache(CACHE_KEYS.profile, p).savedAt
  }

  return { profile, load, reload, ensure, setProfile }
}

// 레벨·배지가 바뀌는 작업(회고 완료 등) 뒤 호출 — 화면엔 기존 값을 유지하고 다음 load()에서 새로 받는다
export function invalidateProfileCache() {
  removePersistedCache(CACHE_KEYS.profile)
  useState<number>('user:profile:savedAt').value = 0
}

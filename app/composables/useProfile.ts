import type { ApiResponse, UserProfile } from '~/types/api'

// 사용자 프로필을 SPA 전역에서 한 번만 받아 공유한다.
// (마이/계정/탈퇴/문의/프로필수정 등 여러 페이지가 각자 /api/v2/users/profile를
//  중복 호출하던 것을 캐시로 묶어 페이지 이동 시 재요청을 막는다.)
export function useProfile() {
  const { $api } = useNuxtApp()
  const profile = useState<UserProfile | null>('user:profile', () => null)

  // 동시에 여러 페이지가 load()를 호출해도 요청은 1회만 나가도록 in-flight 공유
  const inflight = useState<Promise<UserProfile | null> | null>('user:profile:inflight', () => null)

  // 캐시가 있으면 그대로 사용, 없을 때만(또는 force=true) 요청한다.
  async function load(force = false): Promise<UserProfile | null> {
    if (profile.value && !force) return profile.value
    if (inflight.value && !force) return inflight.value
    inflight.value = (async () => {
      try {
        const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
        profile.value = res.data.data
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
    profile.value = res.data.data
    return profile.value
  }

  // 프로필 수정(PATCH) 후 캐시를 갱신해 다른 페이지가 재요청 없이 최신값을 쓰게 한다.
  function setProfile(p: UserProfile) {
    profile.value = p
  }

  return { profile, load, reload, setProfile }
}

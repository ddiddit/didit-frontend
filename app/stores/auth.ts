import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  // useProfile()과 동일한 전역 캐시 키 — 로그아웃 시 함께 비워
  // 다른 계정으로 재로그인했을 때 이전 계정 프로필(닉네임 등)이 남는 것을 방지
  const profileCache = useState<UserProfile | null>('user:profile', () => null)
  const profileInflight = useState<Promise<UserProfile | null> | null>('user:profile:inflight', () => null)

  function setUser(profile: UserProfile) {
    user.value = profile
  }

  function logout() {
    user.value = null
    profileCache.value = null
    profileInflight.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, isLoggedIn, setUser, logout }
})

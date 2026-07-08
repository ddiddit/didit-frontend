import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  function setUser(profile: UserProfile) {
    user.value = profile
  }

  function logout() {
    user.value = null
    // 로그아웃은 navigateTo로 SPA 이동이라 페이지가 리로드되지 않는다.
    // → 전역 useState 캐시(프로필·프로젝트·회고·홈·알림 등)를 모두 비워
    //   다른 계정으로 재로그인했을 때 이전 계정 데이터가 남는 것을 방지한다.
    //   (user 스코프가 아닌 키는 다음 접근 시 기본값 팩토리로 재생성됨)
    clearNuxtState()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, isLoggedIn, setUser, logout }
})

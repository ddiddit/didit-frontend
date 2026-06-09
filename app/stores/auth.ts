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
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, isLoggedIn, setUser, logout }
})

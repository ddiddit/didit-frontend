export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  // 둘 다 없으면 로그인 화면으로
  if (!accessToken || !refreshToken) {
    localStorage.clear()
    return navigateTo('/auth/login')
  }
})

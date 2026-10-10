// Lv.0(아직 회고를 한 번도 완료하지 않은 신규 유저)만 접근 가능한 페이지에 적용.
// retrospect/intro는 '첫 회고 전 온보딩' 화면이라, 이미 Lv.1 이상(회고 완료 이력 있음)인
// 유저가 URL을 직접 치고 들어오면 보여줄 필요가 없어 홈으로 돌려보낸다.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const { profile, load } = useProfile()
  await load()
  if ((profile.value?.currentLevel ?? 0) >= 1) {
    return navigateTo('/home', { replace: true })
  }
})

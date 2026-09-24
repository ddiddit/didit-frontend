// URL 직접 입력·새로고침·북마크로 들어온 접근을 차단하는 미들웨어.
// 회고 진행(start)·결과(result) 화면은 정상 플로우(intro → start, 채팅 → result)를
// 통해서만 들어와야 하고, 이 페이지들의 상태는 전부 메모리(ref)라 새로고침하면 어차피 날아간다.
//
// Vue Router의 최초 내비게이션(앱이 막 부팅된 직후, 즉 URL 직접 진입·새로고침)은
// from.matched 가 비어있다 — 이걸로 "정상적인 앱 내 이동을 거치지 않은 진입"을 판별한다.
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return
  if (from.matched.length === 0) {
    return navigateTo('/home', { replace: true })
  }
})

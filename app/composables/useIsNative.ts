// 웹 vs 네이티브(Capacitor) 분기.
// 현재 Capacitor 미설치 → 항상 false. 앱 패키징 시 Capacitor.isNativePlatform()으로 교체.
// (회고 음성 입력 버튼 등 네이티브 전용 UI 노출 제어에 사용)
export function useIsNative() {
  const isNative = computed(() => {
    // 실제 네이티브(Capacitor) 여부
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (cap?.isNativePlatform?.()) return true

    // [개발용] 웹에서 음성(STT) UI를 확인하고 싶을 때: 주소에 ?native=1 → 켜짐, ?native=0 → 꺼짐(브라우저에 저장).
    // dev 빌드에서만 동작하므로 프로덕션엔 영향 없음.
    if (import.meta.dev && import.meta.client) {
      const q = new URLSearchParams(window.location.search).get('native')
      if (q === '1') localStorage.setItem('forceNative', '1')
      else if (q === '0') localStorage.removeItem('forceNative')
      return localStorage.getItem('forceNative') === '1'
    }

    return false
  })
  return { isNative }
}

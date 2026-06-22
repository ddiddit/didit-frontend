// 웹 vs 네이티브(Capacitor) 분기.
// 현재 Capacitor 미설치 → 항상 false. 앱 패키징 시 Capacitor.isNativePlatform()으로 교체.
// (회고 음성 입력 버튼 등 네이티브 전용 UI 노출 제어에 사용)
export function useIsNative() {
  const isNative = computed(() => {
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    return cap?.isNativePlatform?.() ?? false
  })
  return { isNative }
}

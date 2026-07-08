import type { BadgeView } from '~/composables/useBadges'

// 배지 획득 인앱 배너 큐
// - 여러 개 동시 획득 시 순차 노출 (앞 배너가 닫힌 뒤 다음 배너)
// - 미션 완료 팝업이 떠 있는 동안은 보류(hold) → 확인 클릭 후 노출
const queue = ref<BadgeView[]>([])
const held = ref(false)

export function useBadgeAcquired() {
  const { track } = useAmplitude()

  function show(b: BadgeView) {
    queue.value = [...queue.value, b]
    track('badge_acquired', { badge_name: b.name, badge_code: b.code })
  }

  // 현재 노출할 배지 (보류 중이면 없음)
  const badge = computed(() => (held.value ? null : (queue.value[0] ?? null)))

  // 현재 배너를 큐에서 제거 → 다음 배지가 이어서 노출
  function hide() {
    queue.value = queue.value.slice(1)
  }

  // 미션 완료/실패 팝업 등 모달이 떠 있는 동안 배너 보류
  function setHold(v: boolean) {
    held.value = v
  }

  return { badge, show, hide, setHold }
}

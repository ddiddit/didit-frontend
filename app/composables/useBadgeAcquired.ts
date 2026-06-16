import type { BadgeView } from '~/composables/useBadges'

const badge = ref<BadgeView | null>(null)

export function useBadgeAcquired() {
  const { track } = useAmplitude()

  function show(b: BadgeView) {
    badge.value = b
    track('badge_acquired', { badge_name: b.name, badge_code: b.code })
  }

  function hide() {
    badge.value = null
  }

  return { badge: readonly(badge), show, hide }
}

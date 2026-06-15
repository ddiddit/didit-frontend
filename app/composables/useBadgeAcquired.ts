import type { BadgeView } from '~/composables/useBadges'

const badge = ref<BadgeView | null>(null)

export function useBadgeAcquired() {
  function show(b: BadgeView) {
    badge.value = b
  }

  function hide() {
    badge.value = null
  }

  return { badge: readonly(badge), show, hide }
}

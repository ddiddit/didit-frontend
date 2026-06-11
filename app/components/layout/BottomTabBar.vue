<template>
  <nav
    class="shrink-0 bg-white w-full"
    style="border-top: 1px solid #E8E8E8;"
  >
    <div
      class="flex items-center justify-around"
      style="padding-top: 12px; padding-bottom: max(28px, env(safe-area-inset-bottom, 28px));"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center gap-1"
      >
        <img
          :src="isActive(tab.to) ? tab.iconActive : tab.icon"
          :alt="tab.label"
          class="w-6 h-6 transition-all duration-150"
          :style="isActive(tab.to) ? 'filter: brightness(0) invert(1) brightness(0.098)' : 'filter: brightness(0) invert(1) brightness(0.596)'"
        />
        <span
          class="text-caption1 font-bold transition-colors duration-150"
          :class="isActive(tab.to) ? 'text-grey-13' : 'text-grey-7'"
        >
          {{ tab.label }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const tabs = [
  { to: '/home', label: '홈', icon: '/icons/tab-home.svg', iconActive: '/icons/tab-home.svg' },
  { to: '/retrospects', label: '회고기록', icon: '/icons/tab-retrospect.svg', iconActive: '/icons/tab-retrospect-active.svg' },
  { to: '/my', label: '마이', icon: '/icons/tab-profile.svg', iconActive: '/icons/tab-profile-active.svg' },
]

// 홈 섹션에 속하는 경로 (알림창 포함)
const homeRelatedPaths = ['/notifications']

function isActive(path: string) {
  if (path === '/home' && homeRelatedPaths.includes(route.path)) return true
  return route.path.startsWith(path)
}
</script>

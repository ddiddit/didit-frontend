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
          :src="tab.icon"
          :alt="tab.label"
          class="w-6 h-6 transition-opacity duration-150"
          :class="isActive(tab.to) ? 'opacity-100' : 'opacity-30'"
        />
        <span
          class="text-caption2 font-medium transition-colors duration-150"
          :class="isActive(tab.to) ? 'text-grey-13' : 'text-grey-5'"
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
  { to: '/home', label: '홈', icon: '/icons/tab-home.svg' },
  { to: '/retrospects', label: '회고기록', icon: '/icons/tab-retrospect.svg' },
  { to: '/my', label: '마이', icon: '/icons/tab-profile.svg' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

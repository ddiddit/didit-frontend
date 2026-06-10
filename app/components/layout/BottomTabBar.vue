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
        :class="isActive(tab.to) ? 'text-gray-900' : 'text-gray-400'"
      >
        <Icon
          :name="isActive(tab.to) ? tab.iconActive : tab.icon"
          class="w-6 h-6"
        />
        <span
          class="text-caption2 font-medium"
          :class="isActive(tab.to) ? 'text-gray-900' : 'text-gray-400'"
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
  { to: '/home', label: '홈', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { to: '/retrospects', label: '회고기록', icon: 'heroicons:document-text', iconActive: 'heroicons:document-text-solid' },
  { to: '/my', label: '마이', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

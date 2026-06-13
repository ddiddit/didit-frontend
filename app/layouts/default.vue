<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden min-h-0">
      <slot />
    </div>
    <LayoutBottomTabBar v-if="!hideTabBar" />
  </div>
</template>

<script setup lang="ts">
// 탭바 노출 여부는 각 페이지의 route meta(hideTabBar)로 제어 (전환 시 race 없이 동기 평가)
const route = useRoute()
const hideTabBar = computed(() => route.meta.hideTabBar === true)
</script>

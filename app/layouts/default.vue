<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden min-h-0">
      <slot />
    </div>
    <LayoutBottomTabBar v-if="!hideTabBar" />
  </div>
</template>

<script setup lang="ts">
// components: false라 자동 import가 꺼져 있어 직접 import 해야 탭바가 렌더링된다
import LayoutBottomTabBar from '~/components/layout/BottomTabBar.vue'

// 탭바 노출 여부는 각 페이지의 route meta(hideTabBar)로 제어 (전환 시 race 없이 동기 평가)
const route = useRoute()
const hideTabBar = computed(() => route.meta.hideTabBar === true)

// 프로필 프리페치 — 홈에 있는 동안 미리 받아둬 마이페이지 첫 진입도 캐시로 즉시 그린다
// (load는 캐시·in-flight 공유라 앱 세션당 실제 요청은 1회)
const { load: preloadProfile } = useProfile()
onMounted(() => { void preloadProfile() })
</script>

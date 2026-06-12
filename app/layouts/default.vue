<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden min-h-0">
      <slot />
    </div>
    <LayoutBottomTabBar v-if="!hideTabBar" />
  </div>
</template>

<script setup lang="ts">
const hideTabBar = useState('hideTabBar', () => false)
</script>

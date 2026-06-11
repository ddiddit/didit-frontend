<template>
  <!-- 앱 컨테이너 안에서 flex-col로 탭바를 하단에 고정 -->
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
    <LayoutBottomTabBar />
  </div>
</template>

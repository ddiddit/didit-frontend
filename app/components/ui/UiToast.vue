<template>
  <Teleport to="#app-container">
    <Transition name="toast">
      <div
        v-if="visible"
        class="absolute left-0 right-0 z-50 flex justify-center pointer-events-none bottom-[calc(74px+max(28px,env(safe-area-inset-bottom)))]"
      >
        <!-- figma: bg #3C3C3C, px-14 py-9, rounded-8, 14px Medium 흰색, 아이콘 없음 -->
        <div class="bg-grey-10 rounded-lg px-[14px] py-[9px] whitespace-nowrap">
          <p class="text-[14px] font-medium leading-[1.4] tracking-[-0.02em] text-grey-1">{{ message }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { visible, message } = useToast()
</script>

<style scoped>
.toast-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-leave-active { transition: opacity 0.2s ease, transform 0.15s ease; }
.toast-enter-from  { opacity: 0; transform: translateY(8px); }
.toast-leave-to    { opacity: 0; transform: translateY(8px); }
</style>

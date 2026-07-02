<template>
  <Teleport to="#app-container">
    <Transition name="toast">
      <div
        v-if="visible"
        class="absolute left-0 right-0 z-50 flex justify-center pointer-events-none bottom-[calc(74px+max(28px,env(safe-area-inset-bottom)))]"
      >
        <!-- figma(8088:31255): bg #3C3C3C, rounded-12, px-18 py-13, gap-8, notice 아이콘(danger-50) + 14px Regular 흰색 -->
        <div class="bg-grey-10 rounded-xl px-[18px] py-[13px] flex items-center gap-2 max-w-[calc(100%-40px)]">
          <Icon v-if="withIcon" name="material-symbols:error-outline-rounded" class="w-4 h-4 shrink-0 text-danger" />
          <p class="text-[14px] font-normal leading-[1.6] tracking-[-0.28px] text-grey-1 whitespace-pre-line">{{ message }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { visible, message, withIcon } = useToast()
</script>

<style scoped>
.toast-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-leave-active { transition: opacity 0.2s ease, transform 0.15s ease; }
.toast-enter-from  { opacity: 0; transform: translateY(8px); }
.toast-leave-to    { opacity: 0; transform: translateY(8px); }
</style>

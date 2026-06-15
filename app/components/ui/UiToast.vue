<template>
  <Teleport to="#app-container">
    <Transition name="toast">
      <div
        v-if="visible"
        class="absolute left-4 right-4 bottom-[calc(max(50px,env(safe-area-inset-bottom))+12px)] z-50 flex items-center gap-2 bg-grey-10 rounded-xl px-4 py-3 pointer-events-none"
      >
        <Icon name="gridicons:notice-outline" class="w-[18px] h-[18px] text-grey-1 shrink-0" />
        <p class="text-[14px] font-normal leading-[160%] tracking-[-0.02em] text-grey-1">{{ message }}</p>
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

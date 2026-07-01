<template>
  <!-- 미션 실패 팝업 (Figma 28123/6050): 제목 → 아이콘 → 메시지 → 다시 도전하기 -->
  <div class="popup-pop w-full max-w-[300px] mx-auto bg-white rounded-2xl px-5 pt-6 pb-5 flex flex-col items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.1)]">
    <!-- 제목 -->
    <p class="text-[17px] font-semibold text-grey-13 text-center tracking-[-0.02em]" style="line-height:140%">
      회고 미션 실패
    </p>
    <!-- 실패 아이콘 (Figma Icon.svg — 회색 픽셀 경고) -->
    <img src="/icons/mission-fail.svg" alt="" class="w-16 h-16 mt-4" aria-hidden="true" />
    <!-- 메시지 -->
    <p
      class="text-[14px] font-medium text-grey-8 text-center whitespace-pre-line tracking-[-0.02em] mt-3.5"
      style="line-height:160%"
    >
      {{ message }}
    </p>
    <!-- 다시 도전하기 -->
    <button
      class="w-full h-[50px] rounded-xl bg-primary text-[15px] font-semibold text-grey-13 tracking-[-0.02em] transition-opacity active:opacity-80 disabled:opacity-60 mt-5"
      :disabled="loading"
      @click="emit('retry')"
    >
      다시 도전하기
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; loading?: boolean }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<style scoped>
@keyframes popupPop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.popup-pop { animation: popupPop 0.28s ease-out both; }
</style>

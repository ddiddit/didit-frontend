<template>
  <Teleport to="#app-container">
    <!-- 배지 획득 팝업 — 딤 배경 위 가운데 카드로 노출되고 BANNER_DURATION_MS 뒤 자동으로 사라진다(탭하면 즉시 닫힘) -->
    <Transition name="badge-popup">
      <div
        v-if="badge"
        :key="badge.code"
        class="absolute inset-0 z-50 flex items-center justify-center px-[56px] cursor-pointer"
        @click="hide"
      >
        <div class="absolute inset-0 bg-black/40" />
        <div class="badge-popup__card relative w-full max-w-[300px] bg-grey-1 rounded-[20px] px-5 pt-[24px] pb-[36px] flex flex-col items-center">
          <img :src="badge.image" :alt="badge.name" class="w-[164px] h-[120px] object-contain" />
          <p class="mt-[16px] text-[17px] font-semibold leading-[1.4] tracking-[-0.02em] text-grey-13 text-center">{{ badge.congratsTitle }}</p>
          <p class="mt-2 text-[14px] font-normal leading-[1.6] tracking-[-0.02em] text-grey-8 text-center whitespace-pre-line">{{ badge.congratsText }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { badge, hide } = useBadgeAcquired()

// 배너 자동 닫힘 시간
const BANNER_DURATION_MS = 1500
let timer: ReturnType<typeof setTimeout> | undefined

// 노출할 배지가 바뀔 때마다(새 배너·큐의 다음 배너·보류 해제) 타이머를 새로 건다.
// 보류(hold) 중이면 badge가 null이라 타이머가 정리되고, 해제되면 다시 1.5초부터 센다
watch(badge, (b) => {
  clearTimeout(timer)
  if (b) timer = setTimeout(hide, BANNER_DURATION_MS)
}, { immediate: true })

onUnmounted(() => clearTimeout(timer))
</script>

<style scoped>
.badge-popup-enter-active, .badge-popup-leave-active { transition: opacity 0.2s ease; }
.badge-popup-enter-from, .badge-popup-leave-to { opacity: 0; }
.badge-popup-enter-active .badge-popup__card { transition: transform 0.2s ease; }
.badge-popup-enter-from .badge-popup__card { transform: scale(0.95); }
</style>

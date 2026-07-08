<template>
  <!-- 배지 획득 인앱 배너: 상단 슬라이드 인 → 3.5초 후 자동 닫힘
       클릭 → 배지 화면 이동 / 스와이프(상·하) → 수동 닫기 / 여러 개면 순차 노출 -->
  <Teleport to="#app-container">
    <Transition name="badge-banner">
      <button
        v-if="badge"
        :key="badge.code"
        class="absolute left-4 right-4 z-[70] bg-white rounded-2xl px-4 py-3 flex items-center gap-3 text-left shadow-[0_4px_20px_0_rgba(0,0,0,0.15)]"
        :style="{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }"
        @click="onClick"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <!-- 배지 썸네일 -->
        <img :src="badge.image" :alt="badge.name" class="w-12 h-9 object-contain shrink-0" />
        <!-- 타이틀 + 본문 -->
        <span class="flex-1 min-w-0 flex flex-col gap-0.5">
          <span class="text-[15px] font-semibold text-grey-13 leading-[1.4] truncate">{{ badge.congratsTitle }}</span>
          <span class="text-[13px] font-normal text-grey-8 leading-[1.4] line-clamp-2">{{ bodyText }}</span>
        </span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { badge, hide } = useBadgeAcquired()

// 본문은 배너에서 한 문단으로 (팝업용 줄바꿈 제거)
const bodyText = computed(() => badge.value?.congratsText.replace(/\n/g, ' ') ?? '')

// 자동 닫힘 (3.5초)
let hideTimer: ReturnType<typeof setTimeout> | null = null
let touchY = 0

watch(badge, (b) => {
  if (!b) return
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(dismiss, 3500)
}, { immediate: true })

function dismiss() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  // 큐에서 제거 → 다음 배지가 있으면 이어서 슬라이드 인
  hide()
}

function onClick() {
  dismiss()
  navigateTo('/badges')
}

function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0]?.clientY ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dy = (e.changedTouches[0]?.clientY ?? 0) - touchY
  if (Math.abs(dy) > 30) dismiss()
}

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.badge-banner-enter-active { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease; }
.badge-banner-leave-active { transition: transform 0.25s ease-in, opacity 0.25s ease; }
.badge-banner-enter-from,
.badge-banner-leave-to { transform: translateY(-130%); opacity: 0; }
</style>

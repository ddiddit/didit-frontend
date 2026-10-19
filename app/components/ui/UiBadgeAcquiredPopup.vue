<template>
  <Teleport to="#app-container">
    <!-- 배지 획득 토스트 배너 — 상단에 노출되고 BANNER_DURATION_MS 뒤 자동으로 사라진다(탭하면 즉시 닫힘).
         저장 완료 토스트(UiToast)가 하단에 함께 뜨므로 겹치지 않게 상단에 둔다 -->
    <Transition name="badge-banner">
      <div
        v-if="badge"
        :key="badge.code"
        class="absolute left-0 right-0 z-50 flex justify-center top-[calc(16px+env(safe-area-inset-top,0px))]"
      >
        <div
          class="bg-grey-10 rounded-xl px-[14px] py-[10px] flex items-center gap-[10px] max-w-[calc(100%-40px)] cursor-pointer"
          @click="hide"
        >
          <img :src="badge.image" :alt="badge.name" class="w-[36px] h-[36px] object-contain shrink-0" />
          <div class="flex flex-col min-w-0">
            <p class="text-[14px] font-semibold leading-[1.5] tracking-[-0.28px] text-grey-1">{{ badge.congratsTitle }}</p>
            <p class="text-[12px] font-normal leading-[1.5] tracking-[-0.24px] text-grey-5 truncate">{{ badge.name }} 배지를 획득했어요</p>
          </div>
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
.badge-banner-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.badge-banner-leave-active { transition: opacity 0.2s ease, transform 0.15s ease; }
.badge-banner-enter-from  { opacity: 0; transform: translateY(-8px); }
.badge-banner-leave-to    { opacity: 0; transform: translateY(-8px); }
</style>

<template>
  <!-- 미션 완료/레벨업 팝업 카드: 왕관(아래→위 상승) + confetti + 메시지 + 확인 -->
  <div class="relative w-full max-w-[300px] mx-auto pt-[46px]">
    <!-- 왕관 (카드 위로 솟으며 상승) -->
    <img
      :src="`/icons/levels/lv-${level}.svg`"
      :alt="`레벨 ${level} 달성`"
      class="crown-rise absolute top-0 left-1/2 w-[84px] h-[84px] z-10"
    />
    <!-- 카드 -->
    <div class="popup-pop bg-white rounded-2xl px-5 pt-[56px] pb-5 flex flex-col items-center gap-[14px] shadow-[0_4px_20px_0_rgba(0,0,0,0.1)]">
      <div class="flex flex-col items-center gap-2">
        <p class="text-[17px] font-semibold text-grey-13 text-center tracking-[-0.02em]" style="line-height:140%">
          회고 미션 완료!
        </p>
        <p
          class="text-[14px] font-medium text-grey-8 text-center whitespace-pre-line tracking-[-0.02em]"
          style="line-height:160%"
        >
          {{ message }}
        </p>
      </div>
      <button
        class="w-full h-[50px] rounded-xl bg-primary text-[15px] font-semibold text-grey-13 tracking-[-0.02em] transition-opacity active:opacity-80 disabled:opacity-60"
        :disabled="loading"
        @click="emit('confirm')"
      >
        확인
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ level: number; message: string; loading?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()

// 미션 완료 confetti (Primary 30·50·55·60) — 앱 컨테이너(#app-container) 안에서만 재생.
// 전체 브라우저가 아니라 390px 앱 화면 안으로 가두려고 컨테이너에 전용 캔버스를 붙인다.
let removeCanvas: (() => void) | null = null
onMounted(async () => {
  if (!import.meta.client) return
  const confettiLib = (await import('canvas-confetti')).default
  const container = document.getElementById('app-container') ?? document.body
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:60'
  container.appendChild(canvas)
  removeCanvas = () => canvas.remove()
  const fire = confettiLib.create(canvas, { resize: true, useWorker: true })
  const colors = ['#C3F4DF', '#3DDB99', '#37C58A', '#31AF7A']
  fire({ particleCount: 140, spread: 78, startVelocity: 40, origin: { y: 0.5 }, colors, scalar: 0.85, ticks: 220 })
  setTimeout(() => {
    fire({ particleCount: 45, angle: 60, spread: 55, origin: { x: 0, y: 0.55 }, colors })
    fire({ particleCount: 45, angle: 120, spread: 55, origin: { x: 1, y: 0.55 }, colors })
  }, 150)
})
onUnmounted(() => removeCanvas?.())
</script>

<style scoped>
/* 왕관: 아래에서 위로 올라오며 등장 */
@keyframes crownRise {
  from { transform: translate(-50%, 26px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
.crown-rise { animation: crownRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* 카드: 살짝 팝업 */
@keyframes popupPop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.popup-pop { animation: popupPop 0.28s ease-out both; }
</style>

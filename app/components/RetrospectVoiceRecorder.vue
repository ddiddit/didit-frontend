<template>
  <Teleport to="#app-container">
    <div class="absolute inset-0 z-[60] bg-black/40" @click="onCancel" />
    <!-- 레코더 카드 (figma 2225-7905) -->
    <div
      class="absolute left-5 right-5 z-[60] bg-grey-1 rounded-[36px] flex flex-col items-center pt-3 pb-8"
      :style="{
        bottom: '30px',
        transform: dragY > 0 ? `translateY(${dragY}px)` : '',
        transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
      }"
    >
      <!-- 드래그 핸들 영역(상단을 끌어내려 닫기) -->
      <div
        class="absolute top-0 left-0 right-0 h-14 z-10 cursor-grab active:cursor-grabbing"
        @mousedown="onDragDown"
        @touchstart.passive="onDragDown"
      />
      <!-- 핸들 pill -->
      <div class="w-[50px] h-[5px] rounded-[5px] bg-grey-5" />

      <!-- 타이머: 빨간 점 + 시간 -->
      <div class="flex items-center gap-2 mt-7">
        <span class="w-[6px] h-[6px] rounded-full" :class="isPaused ? 'bg-grey-6' : 'bg-accent'" />
        <span class="text-[15px] font-medium leading-[1.5] tracking-[-0.3px] text-grey-8 w-16 text-center tabular-nums">
          {{ timeLabel }}
        </span>
      </div>

      <!-- 파형: 중앙 점선 + 얇은 막대 (풀폭) -->
      <div class="relative w-full h-[110px] mt-7 flex items-center overflow-hidden">
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-primary/40" />
        <div class="relative flex-1 flex items-center justify-center gap-[2px] h-full px-1">
          <span
            v-for="(b, i) in bars"
            :key="i"
            class="w-[2px] rounded-full bg-primary shrink-0 transition-[height] duration-100"
            :style="{ height: Math.max(4, b) + '%' }"
          />
        </div>
      </div>

      <!-- 버튼: 일시정지/재생 + 전송 -->
      <div class="flex items-center gap-3 mt-[30px]">
        <button
          class="w-12 h-12 rounded-full bg-grey-3 flex items-center justify-center"
          :aria-label="isPaused ? '재생' : '일시정지'"
          @click="togglePause"
        >
          <img v-if="!isPaused" src="/icons/stt-pause.svg" alt="" class="w-3 h-[14px]" />
          <img v-else src="/icons/stt-play.svg" alt="" class="w-6 h-6" />
        </button>
        <button
          class="w-12 h-12 rounded-3xl bg-grey-3 flex items-center justify-center"
          aria-label="전송"
          @click="onSend"
        >
          <img src="/icons/stt-send.svg" alt="" class="w-6 h-6" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{ done: [blob: Blob]; cancel: [] }>()
const { show } = useToast()
const recorder = useVoiceRecorder()

// 파형 막대 (녹음 중엔 좌→우로 흐르듯 갱신, 일시정지 시 정지) — 얇고 촘촘하게
const BAR_COUNT = 84
const bars = ref<number[]>(Array.from({ length: BAR_COUNT }, () => 8))
let waveTimer: ReturnType<typeof setInterval> | null = null

// 마이크 없이 UI만 확인하는 미리보기(개발 전용)
const previewMode = ref(false)
const previewPaused = ref(false)
const previewElapsed = ref(0)
let previewTimer: ReturnType<typeof setInterval> | null = null

const isPaused = computed(() => (previewMode.value ? previewPaused.value : recorder.isPaused.value))

const timeLabel = computed(() => {
  const s = previewMode.value ? previewElapsed.value : recorder.elapsed.value
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

function startWave() {
  stopWave()
  waveTimer = setInterval(() => {
    // 대부분 낮고 가끔 솟는 자연스러운 파형
    bars.value = [...bars.value.slice(1), 6 + Math.random() ** 2 * 92]
  }, 90)
}
function stopWave() {
  if (waveTimer) {
    clearInterval(waveTimer)
    waveTimer = null
  }
}
function startPreviewTimer() {
  previewTimer = setInterval(() => {
    previewElapsed.value += 1
  }, 1000)
}
function stopPreviewTimer() {
  if (previewTimer) {
    clearInterval(previewTimer)
    previewTimer = null
  }
}

function togglePause() {
  if (previewMode.value) {
    previewPaused.value = !previewPaused.value
    if (previewPaused.value) {
      stopWave()
      stopPreviewTimer()
    } else {
      startWave()
      startPreviewTimer()
    }
    return
  }
  if (recorder.isPaused.value) {
    recorder.resume()
    startWave()
  } else {
    recorder.pause()
    stopWave()
  }
}

async function onSend() {
  stopWave()
  if (previewMode.value) {
    show('미리보기 모드라 전송할 음성이 없어요.')
    emit('cancel')
    return
  }
  const blob = await recorder.stop()
  if (blob) emit('done', blob)
  else emit('cancel')
}

function onCancel() {
  stopWave()
  stopPreviewTimer()
  recorder.cancel()
  emit('cancel')
}

onMounted(async () => {
  const ok = await recorder.start()
  if (!ok) {
    // 실제 네이티브(Capacitor) 앱이면 안내 후 닫기, 그 외(웹 미리보기 토글)면 UI 유지해 디자인 확인 가능
    const realNative = !!(globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    if (realNative) {
      show('마이크를 사용할 수 없어요. 권한을 확인해 주세요.')
      emit('cancel')
      return
    }
    previewMode.value = true
    startPreviewTimer()
  }
  startWave()
})

// 끌어내려 닫기 (다른 바텀시트와 동일 — 마우스/터치)
const dragY = ref(0)
const dragging = ref(false)
let dragStartY = 0

function pointerY(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
}
function onDragDown(e: MouseEvent | TouchEvent) {
  dragging.value = true
  dragStartY = pointerY(e)
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragUp)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', onDragUp)
}
function onDragMove(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return
  if (e.cancelable && 'touches' in e) e.preventDefault()
  dragY.value = Math.max(0, pointerY(e) - dragStartY)
}
function onDragUp(e: MouseEvent | TouchEvent) {
  removeDragListeners()
  dragging.value = false
  const dragged = pointerY(e) - dragStartY
  dragY.value = 0
  if (dragged > 90) onCancel()
}
function removeDragListeners() {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragUp)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragUp)
}

onUnmounted(() => {
  stopWave()
  stopPreviewTimer()
  removeDragListeners()
})
</script>

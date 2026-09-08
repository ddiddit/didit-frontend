<template>
  <Teleport to="#app-container">
    <div class="absolute inset-0 z-[60] bg-black/40" @click="onCancel" />
    <!-- 레코더 카드 (figma 2225-7905) -->
    <div
      class="absolute left-5 right-5 z-[60] bg-grey-1 rounded-[36px] flex flex-col items-center pt-3 pb-8"
      :style="{
        bottom: 'calc(30px + env(safe-area-inset-bottom, 0px))',
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
        <span class="w-[6px] h-[6px] rounded-full" :class="recognizing ? 'bg-grey-6' : 'bg-accent'" />
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

      <!-- 녹음 중: 안내 텍스트 → 엔터로 인식 시작 / 인식 중: 체크 표시 -->
      <div class="flex items-center justify-center mt-[30px] h-12">
        <p
          v-if="!recognizing"
          class="text-[15px] font-medium leading-[1.5] tracking-[-0.3px] text-grey-8"
        >
          음성 인식 중···
        </p>
        <div
          v-else
          class="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
          aria-label="음성 인식 완료"
        >
          <Icon name="material-symbols:check-rounded" class="w-6 h-6 text-grey-13" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ retrospectiveId: string }>()
// done: STT 변환이 끝난 텍스트를 부모에 전달. cancel: 닫기. blocked: 권한 영구 거부.
const emit = defineEmits<{ done: [text: string]; cancel: []; blocked: [] }>()
const { show } = useToast()
const recorder = useVoiceRecorder()
const retro = useRetrospect()

// 엔터를 눌러 녹음을 끝내고 STT 변환(transcribe)을 진행 중인 상태 — 이때 버튼 영역은 체크 표시로 바뀐다
const recognizing = ref(false)

// 파형 막대 (녹음 중엔 좌→우로 흐르듯 갱신) — 얇고 촘촘하게
const BAR_COUNT = 84
const bars = ref<number[]>(Array.from({ length: BAR_COUNT }, () => 8))
let waveTimer: ReturnType<typeof setInterval> | null = null

const timeLabel = computed(() => {
  const s = recorder.elapsed.value
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

// 엔터 → 녹음 종료 후 transcribe API로 STT 변환, 결과 텍스트를 done으로 전달
async function onRecognize() {
  if (recognizing.value || !recorder.isRecording.value) return
  recognizing.value = true
  stopWave()
  const blob = await recorder.stop()
  if (!blob) {
    emit('cancel')
    return
  }
  try {
    const content = await retro.transcribe(props.retrospectiveId, blob)
    emit('done', content)
  } catch (e) {
    console.warn('[voice] STT 변환 실패:', e)
    show('음성을 인식하지 못했어요. 다시 시도해 주세요.')
    emit('cancel')
  }
}

// 한글 조합 중 엔터(자모 확정)는 무시
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.isComposing) return
  e.preventDefault()
  onRecognize()
}

function onCancel() {
  if (recognizing.value) return // 변환 중엔 실수로 닫히지 않도록
  stopWave()
  recorder.cancel()
  emit('cancel')
}

onMounted(async () => {
  const ok = await recorder.start()
  if (!ok) {
    // 권한이 영구 거부면 부모가 '설정으로 이동' 안내를 띄우도록 위임, 그 외(1회 거부·장치 없음)엔 일반 토스트
    if (await recorder.isPermissionBlocked()) {
      emit('blocked')
    } else {
      show('마이크를 사용할 수 없어요. 권한을 확인해 주세요.')
      emit('cancel')
    }
    return
  }
  startWave()
  window.addEventListener('keydown', onKeydown)
})

// 끌어내려 닫기 (다른 바텀시트와 동일 — 마우스/터치)
const dragY = ref(0)
const dragging = ref(false)
let dragStartY = 0

function pointerY(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
}
function onDragDown(e: MouseEvent | TouchEvent) {
  if (recognizing.value) return
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
  removeDragListeners()
  window.removeEventListener('keydown', onKeydown)
})
</script>

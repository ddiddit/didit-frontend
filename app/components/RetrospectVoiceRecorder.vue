<template>
  <Teleport to="#app-container">
    <div class="absolute inset-0 z-[60] bg-black/40" @click="onCancel" />
    <!-- 레코더 카드 (figma 2225-7905) -->
    <div
      class="absolute left-5 right-5 z-[60] bg-grey-1 rounded-[36px] flex flex-col items-center pt-3 pb-5"
      style="bottom: 30px"
    >
      <!-- 핸들 -->
      <div class="w-[50px] h-[5px] rounded-[5px] bg-grey-5" />

      <!-- 타이머 -->
      <div class="flex items-center gap-2 mt-[22px]">
        <span class="w-[6px] h-[6px] rounded-full" :class="isPaused ? 'bg-grey-6' : 'bg-accent'" />
        <span class="text-body3 font-medium text-grey-8 w-16 text-center tabular-nums">{{ timeLabel }}</span>
      </div>

      <!-- 파형 -->
      <div class="w-full h-[110px] mt-3 flex items-center justify-center gap-[3px] px-6 overflow-hidden">
        <span
          v-for="(b, i) in bars"
          :key="i"
          class="w-[3px] rounded-full bg-primary shrink-0 transition-[height] duration-150"
          :style="{ height: Math.max(6, b) + '%' }"
        />
      </div>

      <!-- 미리보기 모드 안내(개발 전용) -->
      <p v-if="previewMode" class="text-caption1 text-grey-6 mt-1">미리보기 모드 (마이크 없이 UI만)</p>

      <!-- 버튼: 일시정지/재생 + 전송 -->
      <div class="flex items-center gap-3 mt-2.5">
        <button
          class="w-12 h-12 rounded-full bg-grey-3 flex items-center justify-center"
          :aria-label="isPaused ? '재생' : '일시정지'"
          @click="togglePause"
        >
          <Icon :name="isPaused ? 'mingcute:play-fill' : 'mingcute:pause-fill'" class="w-5 h-5 text-grey-13" />
        </button>
        <button
          class="w-12 h-12 rounded-3xl bg-grey-3 flex items-center justify-center"
          aria-label="전송"
          @click="onSend"
        >
          <Icon name="mingcute:send-fill" class="w-6 h-6 text-grey-13" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{ done: [blob: Blob]; cancel: [] }>()
const { show } = useToast()
const recorder = useVoiceRecorder()

// 파형 막대 (녹음 중엔 좌→우로 흐르듯 갱신, 일시정지 시 정지)
const BAR_COUNT = 56
const bars = ref<number[]>(Array.from({ length: BAR_COUNT }, () => 12))
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
    bars.value = [...bars.value.slice(1), 12 + Math.random() * 88]
  }, 110)
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
    // 마이크 권한/장치 없음: 개발이면 UI 미리보기 유지(디자인 확인), 실제 앱이면 닫기
    if (import.meta.dev) {
      previewMode.value = true
      startPreviewTimer()
    } else {
      show('마이크를 사용할 수 없어요. 권한을 확인해 주세요.')
      emit('cancel')
      return
    }
  }
  startWave()
})

onUnmounted(() => {
  stopWave()
  stopPreviewTimer()
})
</script>

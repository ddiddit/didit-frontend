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
        <span class="w-[6px] h-[6px] rounded-full" :class="recorder.isPaused.value ? 'bg-grey-6' : 'bg-accent'" />
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

      <!-- 버튼: 일시정지/재생 + 전송 -->
      <div class="flex items-center gap-3 mt-2.5">
        <button
          class="w-12 h-12 rounded-full bg-grey-3 flex items-center justify-center"
          :aria-label="recorder.isPaused.value ? '재생' : '일시정지'"
          @click="togglePause"
        >
          <Icon
            :name="recorder.isPaused.value ? 'mingcute:play-fill' : 'mingcute:pause-fill'"
            class="w-5 h-5 text-grey-13"
          />
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

const recorder = useVoiceRecorder()

// 파형 막대 (녹음 중엔 좌→우로 흐르듯 갱신, 일시정지 시 정지)
const BAR_COUNT = 56
const bars = ref<number[]>(Array.from({ length: BAR_COUNT }, () => 12))
let waveTimer: ReturnType<typeof setInterval> | null = null

function startWave() {
  stopWave()
  waveTimer = setInterval(() => {
    // 한 칸씩 밀고 새 막대 추가 → 흐르는 파형
    const next = 12 + Math.random() * 88
    bars.value = [...bars.value.slice(1), next]
  }, 110)
}
function stopWave() {
  if (waveTimer) {
    clearInterval(waveTimer)
    waveTimer = null
  }
}

const timeLabel = computed(() => {
  const s = recorder.elapsed.value
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

function togglePause() {
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
  const blob = await recorder.stop()
  if (blob) emit('done', blob)
  else emit('cancel')
}

function onCancel() {
  stopWave()
  recorder.cancel()
  emit('cancel')
}

onMounted(async () => {
  const ok = await recorder.start()
  if (!ok) {
    emit('cancel')
    return
  }
  startWave()
})

onUnmounted(stopWave)
</script>

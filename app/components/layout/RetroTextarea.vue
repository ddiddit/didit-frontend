<template>
    <div class="retro__input p-[10px] mx-[16px] box-border border border-grey-4 bg-grey-4 rounded-[24px] flex" :class="[isWrapped ? 'items-end' : 'items-center', disabled ? 'opacity-50' : '']">
        <button class="w-[24px] h-[24px] flex justify-center items-center shrink-0" :class="isWrapped ? 'mb-[2px]' : ''" :disabled="disabled">
            <img src="/icons/attach_file.png" alt="첨부파일" />
        </button>
        <input type="file" multiple accept=".pdf,image/*" class="hidden" />
        <textarea @input="handleTextareaChange" @keydown="handleKeydown" ref="textRef" :value="textareaValue" :disabled="disabled" rows="1" class="resize-none outline-none bg-transparent flex-1 mx-[6px]" />
        <button class="shrink-0" :class="isWrapped ? 'mb-[2px]' : ''" :disabled="disabled" @click="emit('accessMic')">
            <img src="/icons/voice.svg" alt="마이크접근" />
        </button>
    </div>
</template>
<style scoped>
</style>
<script setup lang="ts">

  // disabled: AI 메시지 타이핑 중 등 — 첨부·마이크·전송을 모두 잠근다
  const props = defineProps<{ disabled?: boolean }>()

  // Textarea Value
  const textareaValue = ref<string>('')

  // Textarea DOM
  const textRef = ref<HTMLTextAreaElement | null>(null)

  // 두 줄 이상으로 넘어갔는지 — 버튼 정렬(아래쪽 도킹 vs 중앙 정렬)에만 쓰는 값.
  // textarea는 position을 바꾸지 않고 계속 평범한 flex 아이템으로 있어서, 이 값이 폭에는
  // 영향을 주지 않는다 — 그래서 "폭이 판정 결과에 따라 바뀌어 판정이 다시 뒤집히는" 진동이나,
  // "버튼 자리를 위해 얼마나 여백을 더 줘야 하는지"를 계산해서 맞춰야 하는 문제 자체가 없다.
  // (행이 가장 큰 자식인 textarea 높이에 맞춰 자동으로 늘어나고, 버튼은 items-end로 바닥에 붙는다 —
  //  전부 브라우저 flex 레이아웃이 계산해줘서 우리가 여백을 추측하다 어긋나는 버그가 날 수 없다)
  const isWrapped = ref<boolean>(false)

  // 부모(start.vue)에 답변 제출·마이크 접근 요청을 알림 — 채팅 반영·API 호출·권한 처리는 부모 책임
  const emit = defineEmits<{ send: [content: string]; accessMic: [] }>()

  // Enter로 전송 (Shift+Enter는 줄바꿈, 한글 조합 확정 Enter는 무시)
  function handleKeydown(e: KeyboardEvent) {
    if (props.disabled || e.key !== 'Enter' || e.shiftKey || e.isComposing) return
    e.preventDefault() // 기본 동작(줄바꿈) 삽입을 막아야 하므로 동기적으로 먼저 호출

    const content = textareaValue.value.trim()
    if (!content) return

    emit('send', content)

    textareaValue.value = ''
    resetTextarea()
  }

  // 전송 후 입력창을 처음 상태(한 줄)로 되돌린다
  function resetTextarea() {
    isWrapped.value = false
    const el = textRef.value
    if (el) el.style.height = '24px'
  }

  const handleTextareaChange = (e: Event) => {
    textareaValue.value = (e.target as HTMLTextAreaElement).value
    syncHeight()
  }

  // height를 auto로 풀고 다시 재서 "지금 실제로 필요한 높이"를 구한다
  // (풀지 않고 재면 이전에 고정해둔 높이가 그대로 나와서, 두 줄→한 줄로 줄어들 때 반영이 안 됨)
  // textarea가 flex 흐름 안에 그대로 있어서(position 안 바뀜), 이 높이가 늘어나면
  // 부모 .retro__input도 자동으로 같이 늘어난다 — 컨테이너 높이를 따로 계산해서 맞출 필요가 없다
  function syncHeight() {
    const el = textRef.value
    if (!el) return
    el.style.height = 'auto'
    const naturalHeight = el.scrollHeight
    el.style.height = `${naturalHeight}px`
    isWrapped.value = naturalHeight > 24
  }

  // 음성 레코더(부모가 연다)가 STT로 변환한 텍스트를 초안으로 받아온다. 기존 입력이 있으면 뒤에 이어붙인다.
  const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')
  watch(voiceTranscript, (t) => {
    if (!t) return
    textareaValue.value = textareaValue.value ? `${textareaValue.value} ${t}` : t
    voiceTranscript.value = '' // 1회성 채널 — 소비 후 비운다
    nextTick(() => {
      syncHeight()
      textRef.value?.focus()
    })
  })
</script>

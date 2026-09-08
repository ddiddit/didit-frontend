<template>
    <div class="retro__composer mx-[20px] absolute left-0 right-0 bottom-[10px] flex flex-col gap-[8px]">

        <div ref="allRef" class="retro__input relative px-[10px] box-border border border-grey-4 h-[52px] bg-grey-4 rounded-[24px] flex" :class="isTextWrapped ? 'items-end justify-between py-[10px]' : 'items-center'">
            <button class="px-[6px]" :class="isTextWrapped ? 'mb-[2px]' : ''">
                <img src="/icons/attach_file.png" alt="첨부파일" />
            </button>
            <input type="file" multiple accept=".pdf,image/*" class="hidden" />
            <textarea ref="textRef" :disabled="isSending" style="height: 22px;" :value="inputValue" @focus="isInputFocused = true" @blur="isInputFocused = false" @input="handleInputChange" @keydown="handleSend" placeholder="회고를 입력하세요" class="resize-none outline-none text-[14px] leading-[22px] bg-transparent placeholder:text-grey-7 placeholder:text-[14px]" :class="isTextWrapped ? 'absolute left-[10px] right-[10px] bottom-[48px] px-[6px] py-[10px] box-border' : 'w-full'" />
            <button @click="accessMic">
                <img src="/icons/voice.svg" alt="마이크접근" />
            </button>
        </div>
    </div>
</template>
<style scoped>
  /* 회고 입력창 스크롤바 — 얇고 짧은 회색 바 */
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  /* 스크롤바 양 끝 화살표 버튼 제거 */
  textarea::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }
  textarea::-webkit-scrollbar-track {
    margin: 6px 0; /* 위아래 여백 → 바가 짧아 보이게 */
    background: transparent;
  }
  textarea::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background-color: theme('colors.grey.6');
    background-clip: padding-box; /* 테두리만큼 안쪽으로 → 더 가늘게 */
    border: 1px solid transparent;
  }
  textarea::-webkit-scrollbar-thumb:hover {
    background-color: theme('colors.grey.7');
  }
  /* Firefox */
  textarea {
    scrollbar-width: thin;
    scrollbar-color: theme('colors.grey.6') transparent;
  }
</style>
<script setup lang="ts">
  import type { ChatMessage } from '~/pages/retrospect/start.vue';

  const { answer, getDeepQuestion } = useRetrospect()

  const props = defineProps<{
    retrospectId: string
    accessMic: () => void
    messages: ChatMessage[]
  }>()

  // 다음 질문(didit 메시지) 타이핑 애니메이션 — start.vue(첫 질문)와 공용
  const { typeDiditMessage, clearTypingTimers } = useDiditTyping()
  onUnmounted(clearTypingTimers)

  // 다시 질문 보내는 중... 상황을 나타내는 변수
  const isSending = ref(false)

  // 회고 입력 창 포커스 시 관리할 상태
  const isInputFocused = ref(false)

  // 입력 값 관리할 상태
  const inputValue = ref('')

  // 줄 넘어가는 여부
  const isTextWrapped = ref(false)

  // 텍스트애리어 자체 ref
  const textRef = ref<HTMLTextAreaElement | null>(null)

  // 전체 자체 ref
  const allRef = ref<HTMLDivElement | null>(null)

  // 한 줄 높이(px) — textarea 의 leading-[22px] / style="height: 22px" 와 반드시 일치
  const LINE_HEIGHT = 22
  // 컨테이너 상하 패딩 (줄바꿈 시 py-[10px])
  const PADDING_Y = 10
  // wrapped 상태에서 textarea 자체에 붙는 상하 패딩 (py-[10px])
  const TA_PADDING_Y = 10
  // 최대 표시 줄 수 — 이 이상은 늘리지 않고 스크롤
  const MAX_LINES = 4
  const MAX_TEXT_HEIGHT = LINE_HEIGHT * MAX_LINES

  // 한 줄(인라인) 상태의 textarea 콘텐츠 폭 — 측정 기준을 항상 이 폭으로 고정한다.
  // (wrapped 되면 absolute 로 폭이 넓어져서, 넓은 폭에서 재면 1줄로 보여 무한 토글이 남)
  let inlineWidth = 0

  // 입력창 높이·줄바꿈 상태를 재계산
  // (입력할 때뿐 아니라 창 크기가 바뀌어 줄바꿈 지점이 달라질 때도 호출)
  function syncHeight() {
    const el = textRef.value
    const all = allRef.value
    if (!el || !all) return

    // 한 줄 상태의 실제 폭을 기억해 둔다 (이 폭에서 넘치는지가 wrapped 판정 기준)
    if (!isTextWrapped.value) inlineWidth = el.clientWidth
    if (!inlineWidth) return

    // --- 측정: 항상 "한 줄 상태" 지오메트리로 강제한 뒤 잰다 ---
    const s = el.style
    const saved = { width: s.width, height: s.height, padding: s.padding, boxSizing: s.boxSizing }
    s.boxSizing = 'content-box'
    s.padding = '0px'
    s.width = `${inlineWidth}px`
    s.height = '0px'

    const textHeight = el.scrollHeight // padding 0 → 순수 텍스트 높이
    const wrapped = textHeight > LINE_HEIGHT * 1.5

    // 측정용 인라인 스타일 원복 (실제 표시 스타일은 클래스가 결정)
    s.width = saved.width
    s.padding = saved.padding
    s.boxSizing = saved.boxSizing
    s.height = saved.height

    // 한 줄 유지 중이면 아무 것도 하지 않음 (스타일 조작 X)
    if (!wrapped && !isTextWrapped.value) return

    isTextWrapped.value = wrapped
    if (wrapped) {
      // 최대 MAX_LINES 까지만 늘리고, 그 이상은 높이 고정 + 스크롤
      const visibleHeight = Math.min(textHeight, MAX_TEXT_HEIGHT)
      el.style.overflowY = textHeight > MAX_TEXT_HEIGHT ? 'auto' : 'hidden'
      // wrapped textarea 는 box-border + py-[10px] 이므로 패딩만큼 더해준다
      el.style.height = `${visibleHeight + TA_PADDING_Y * 2}px`
      all.style.height = `${28 + visibleHeight + TA_PADDING_Y * 2 + PADDING_Y * 2}px`
    } else {
      // 한 줄로 돌아오면 원복 (인라인 제거 → 클래스/기본 인라인으로 복귀)
      el.style.overflowY = 'hidden'
      el.style.height = `${LINE_HEIGHT}px`
      all.style.height = ''
    }
  }

  // Textarea 입력하기 — Enter로 전송 (Shift+Enter, 한글 조합 확정 Enter는 줄바꿈/무시)
  async function handleSend(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing || event.shiftKey) return
    event.preventDefault() // await 전에 동기 호출해야 기본 동작(줄바꿈) 삽입을 막을 수 있음

    const content = inputValue.value.trim()
    if (!content || isSending.value) return // TODO: TOAST UI로 채팅을 입력해주셔야 합니다 추가하기

    // 사용자 메시지를 먼저 채팅에 반영하고 입력창은 비운다
    props.messages.push({ id: crypto.randomUUID(), role: 'user', text: content })
    inputValue.value = ''
    nextTick(syncHeight)

    // AI 응답을 기다리는 동안 보여줄 자리표시자 — id를 기억해뒀다가 응답 도착 시 이 자리를 교체한다
    const generatingId = crypto.randomUUID()
    props.messages.push({ id: generatingId, role: 'generating' })

    isSending.value = true
    try {
      const response = await answer(props.retrospectId, content)

      const idx = props.messages.findIndex(m => m.id === generatingId)
      if (idx === -1) return

      if (!response.assistantMessage) {
        // 다음 질문 없이 완료 준비 신호만 온 경우 — 완료 플로우는 별도 처리 필요
        props.messages.splice(idx, 1)
        return
      }

      // readyToComplete가 true면 지금까지 답변으로 완료해도 될 만큼 쌓였다는 뜻이라,
      // 다음 질문이 와도 skippable로 표시해 건너뛸 수 있게 한다
      const diditMessage = buildDiditMessage(response.assistantMessage, response.readyToComplete)
      props.messages.splice(idx, 1, diditMessage)
      typeDiditMessage(diditMessage)
    } catch {
      // 실패 시 generating 자리표시자 제거 (에러 안내는 이후 처리)
      const idx = props.messages.findIndex(m => m.id === generatingId)
      if (idx !== -1) props.messages.splice(idx, 1)
    } finally {
      isSending.value = false
      console.log(props.messages)
    }
  }

  // 입력 값 체인지
  function handleInputChange(event: Event) {
    inputValue.value = (event.target as HTMLTextAreaElement).value
    syncHeight()
  }

  // 창 크기 변경 시에도 줄바꿈 여부가 달라질 수 있으므로 재계산 (언마운트 시 자동 해제)
  useEventListener(window, 'resize', useThrottleFn(syncHeight, 100))

  // 음성 레코더가 STT로 변환한 텍스트를 입력창 초안으로 받아온다. 기존 입력이 있으면 뒤에 이어붙인다.
  const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')
  watch(voiceTranscript, (t) => {
    if (!t) return
    inputValue.value = inputValue.value ? `${inputValue.value} ${t}` : t
    voiceTranscript.value = '' // 1회성 채널 — 소비 후 비운다
    nextTick(() => {
      syncHeight()
      textRef.value?.focus()
    })
  })

</script>

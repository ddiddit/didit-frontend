<template>
    <div class="retro__composer mx-[20px] absolute left-0 right-0 bottom-[10px] flex flex-col gap-[8px]">

        <div ref="allRef" class="retro__input relative px-[10px] box-border border border-grey-4 h-[52px] bg-grey-4 rounded-[24px] flex" :class="isTextWrapped ? 'items-end justify-between py-[10px]' : 'items-center'">
            <button class="px-[6px]" :class="isTextWrapped ? 'mb-[2px]' : ''">
                <img src="/icons/attach_file.png" alt="첨부파일" />
            </button>
            <input type="file" multiple accept=".pdf,image/*" class="hidden" />
            <textarea ref="textRef" style="height: 22px;" :value="inputValue" :disabled="sending" @focus="isInputFocused = true" @blur="isInputFocused = false" @input="handleInputChange" @keydown="handleSend" placeholder="회고를 입력하세요" class="resize-none outline-none text-[14px] leading-[22px] bg-transparent placeholder:text-grey-7 placeholder:text-[14px] disabled:opacity-50" :class="isTextWrapped ? 'absolute left-[10px] right-[10px] bottom-[48px] px-[6px] py-[10px] box-border' : 'w-full'" />
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

  const { answer, getDeepQuestion } = useRetrospect()

  const props = defineProps<{
    retrospectId: string
    saveAnswer: (text: string) => void
    nextQuestion: (questionType: string, content: string, skippable?: boolean) => void
    setGenerating: (on: boolean) => void
    completeRetro: () => void
    accessMic: () => void
  }>()

  const text = ref('')

  // 회고 입력 창 포커스 시 관리할 상태
  const isInputFocused = ref(false)

  // 입력 값 관리할 상태
  const inputValue = ref('')

  // 전송 중 중복 Enter 방지
  const sending = ref(false)

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

  // 심화질문 "생성 중" placeholder — 실제 질문이 아니므로 렌더하면 안 됨
  const DEEP_PLACEHOLDERS = ['심화 질문을 생성 중입니다.', 'Q1~Q3 답변을 보내주시면']
  const isPlaceholder = (s: string | null): boolean =>
    !s || DEEP_PLACEHOLDERS.some((p) => s.startsWith(p))

  // 심화질문 본문 폴링 — isReady=true 이고 실제 본문일 때만 반환, 실패/타임아웃이면 null
  async function pollDeepQuestion(id: string, tries = 25, interval = 1200): Promise<string | null> {
    for (let n = 0; n < tries; n++) {
      try {
        const res = await getDeepQuestion(id)
        console.log(`[deep-question] try ${n + 1}/${tries}`, res) // { isReady, content }
        if (res.isReady && res.content && !isPlaceholder(res.content)) return res.content
      } catch (e) {
        console.error('[deep-question] 조회 실패', e)
        return null // 심화질문 생성 실패는 치명적이지 않음
      }
      await new Promise((r) => setTimeout(r, interval))
    }
    console.warn('[deep-question] 타임아웃 — 25회 폴링 동안 생성 안 됨')
    return null
  }

  // 입력 값 전송
  async function handleSend(event: KeyboardEvent) {
    // 한글 조합 중 Enter(자모 확정)는 전송으로 처리하지 않음
    if (event.isComposing) return
    // Shift+Enter는 줄바꿈용으로 남겨둠
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault() // textarea에 개행 문자 들어가는 것 방지
    if (sending.value) return

    // 보낼 값을 따로 변수에 저장
    text.value = inputValue.value.trim()
    if (!text.value) return

    sending.value = true
    inputValue.value = '' // 입력값은 즉시 비운다

    // 입력창 높이·줄바꿈 상태 초기화
    isTextWrapped.value = false
    if (textRef.value) {
      textRef.value.style.height = `${LINE_HEIGHT}px`
      textRef.value.style.overflowY = 'hidden'
    }
    if (allRef.value) allRef.value.style.height = '' // 인라인 제거 → h-[52px] 클래스로 복귀

    try {
      console.log('[answer] retrospectId:', props.retrospectId)
      const res = await answer(props.retrospectId, text.value)
      console.log('[answer] res:', res)
      props.saveAnswer(text.value)

      // 1) 심화질문 예약 — nextQuestionContent는 "생성 중" placeholder라 버리고 /deep-question 폴링
      if (res.nextQuestionType === 'Q4_DEEP') {
        console.log('[deep-question] 폴링 시작 retrospectId:', props.retrospectId)
        props.setGenerating(true)
        const content = await pollDeepQuestion(props.retrospectId)
        props.setGenerating(false)
        if (content) {
            console.log(content)
            props.nextQuestion('Q4_DEEP', content, true)// 심화질문은 스킵 가능
        } 
        else props.completeRetro() // 생성 실패/타임아웃 → 심화질문 건너뛰고 완료 단계로
        return
      }

      // 2) 일반 다음 질문
      if (res.nextQuestionType && res.nextQuestionContent && !isPlaceholder(res.nextQuestionContent)) {
        props.nextQuestion(res.nextQuestionType, res.nextQuestionContent)
        return
      }

      // 3) 다음 질문 없음 = 완료 신호
      if (res.isReadyToComplete) props.completeRetro()
    } catch (e) {
      inputValue.value = text.value // 실패 시 입력값 복구
      console.error(e)
    } finally {
      sending.value = false
    }
  }

</script>

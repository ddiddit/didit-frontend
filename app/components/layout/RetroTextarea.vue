<template>
    <div ref="allRef" class="retro__input mx-[20px] px-[10px] box-border border border-grey-4 absolute left-0 right-0 bottom-[10px] h-[52px] bg-grey-4 rounded-[24px] flex" :class="isTextWrapped ? 'items-end justify-between py-[10px]' : 'items-center'">
        <button class="px-[6px]" :class="isTextWrapped ? 'mb-[2px]' : ''">
            <img src="/icons/attach_file.png" alt="첨부파일" />
        </button>
        <textarea ref="textRef" style="height: 22px;" :value="inputValue" :disabled="sending" @focus="isInputFocused = true" @blur="isInputFocused = false" @input="handleInputChange" @keydown="handleSend" placeholder="회고를 입력하세요" class="resize-none outline-none text-[14px] bg-transparent placeholder:text-grey-7 placeholder:text-[14px] disabled:opacity-50" :class="isTextWrapped ? 'absolute left-[10px] right-[10px] bottom-[48px] px-[6px] py-[10px] box-border' : 'w-full'" />
        <button>
            <img src="/icons/voice.svg" alt="전송" />
        </button>
    </div>
</template>
<style scoped></style>
<script setup lang="ts">

  const { answer, getDeepQuestion } = useRetrospect()

  const props = defineProps<{
    retrospectId: string
    saveAnswer: (text: string) => void
    nextQuestion: (questionType: string, content: string, skippable?: boolean) => void
    setGenerating: (on: boolean) => void
    completeRetro: () => void
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

  // 한 줄 기준 높이(px) — style="height: 22px" 와 맞춤
  const LINE_HEIGHT = 22
  // 컨테이너 상하 패딩 (줄바꿈 시 py-[10px])
  const PADDING_Y = 10

  // 입력 값 체인지
  function handleInputChange(event: Event) {
    inputValue.value = (event.target as HTMLTextAreaElement).value

    const el = textRef.value
    const all = allRef.value
    if (!el || !all) return

    // 이미 늘어난 상태면 축소 감지를 위해 높이를 0으로 눌러줌
    // ('auto' 는 rows 기본값(2줄) 높이로 잡혀서 축소 감지가 안 됨)
    // (한 줄 상태에선 scrollHeight 가 알아서 넘침을 알려주므로 초기화 불필요)
    if (isTextWrapped.value) el.style.height = '0px'

    // scrollHeight 는 padding 을 포함한다. wrapped 클래스에서 textarea 에
    // py-[10px] box-border 가 붙으므로, 순수 텍스트 높이로 비교하려면 padding 을 뺀다.
    const cs = getComputedStyle(el)
    const paddingV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const contentHeight = el.scrollHeight
    const textHeight = contentHeight - paddingV
    const wrapped = textHeight > LINE_HEIGHT * 1.5

    // 한 줄 유지 중이면 아무 것도 하지 않음 (스타일 조작 X)
    if (!wrapped && !isTextWrapped.value) return

    isTextWrapped.value = wrapped
    if (wrapped) {
      // 줄이 넘어갔을 때만 콘텐츠 높이만큼 늘림
      el.style.height = `${contentHeight}px`
      all.style.height = `${28 + contentHeight + PADDING_Y * 2}px`
    } else {
      // 한 줄로 돌아오면 원복 (인라인 제거 → 클래스/기본 인라인으로 복귀)
      el.style.height = `${LINE_HEIGHT}px`
      all.style.height = ''
    }
  }

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
    if (textRef.value) textRef.value.style.height = `${LINE_HEIGHT}px`
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

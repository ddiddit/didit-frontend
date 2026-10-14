import type { ChatMessage } from '~/pages/retrospect/start.vue'
import type { AnswerGuide } from '~/types/api'

// AI 메시지(초기 질문 InitialMessage · 다음 질문 AssistantMessage · 대화 조회 ConversationMessage)를
// 공통 'didit' 채팅 메시지로 변환. INTRO 타입은 title/body, CONVERSATION 타입은 content에 본문이 온다.
export function buildDiditMessage(
  m: {
    id: string
    title?: string | null
    body?: string | null
    content?: string | null
    answerGuide?: AnswerGuide | null
  },
  skippable = false, // 답변 후 readyToComplete가 true면(=완료해도 될 만큼 내용이 쌓임) 이 질문은 건너뛸 수 있음
): Extract<ChatMessage, { role: 'didit' }> {
  // 예시가 비어 있으면 answerGuide가 없는 것과 같게 취급(예시 UI 미표시)
  const answerGuide = m.answerGuide?.examples?.length ? m.answerGuide : undefined
  return reactive({
    id: m.id,
    role: 'didit',
    main: m.content ?? m.title ?? '',
    sub: m.body ?? undefined,
    typedMain: '',
    showSub: false,
    skippable,
    answerGuide,
    // INLINE은 질문과 함께 바로 펼치고, ON_DEMAND는 '답변 예시 보기'를 눌렀을 때 펼친다
    showExamples: answerGuide?.mode === 'INLINE',
  })
}

// didit 메시지 본문(main)을 delay 간격으로 한 글자씩 typedMain에 채우고,
// 완료되면 가이드/스킵(showSub)을 노출한다.
// 회고 시작(첫 질문)·답변 제출(다음 질문) 양쪽에서 공용으로 쓰기 위해 분리했다.
export function useDiditTyping() {
  const typingTimers: ReturnType<typeof setInterval>[] = []

  function typeDiditMessage(msg: Extract<ChatMessage, { role: 'didit' }>, delay = 50, onComplete?: () => void) {
    msg.typedMain = ''
    msg.showSub = false
    let i = 0
    const timer = setInterval(() => {
      msg.typedMain += msg.main[i] ?? ''
      i += 1
      if (i >= msg.main.length) {
        clearInterval(timer)

        // 타이핑 완료 후 0.4초 뒤에 가이드 말풍선을 노출 (Transition으로 부드럽게 등장)
        // 가이드 문구가 없는 질문(심화질문 Q4_DEEP 등)은 빈 말풍선이 뜨지 않도록 건너뜀
        if (msg.sub) typingTimers.push(setTimeout(() => { msg.showSub = true }, 400))

        onComplete?.()
      }
    }, delay)
    typingTimers.push(timer)
  }

  // 컴포넌트 언마운트 시 남은 타이머 정리용
  function clearTypingTimers() {
    typingTimers.forEach(clearInterval)
  }

  return { typeDiditMessage, clearTypingTimers }
}

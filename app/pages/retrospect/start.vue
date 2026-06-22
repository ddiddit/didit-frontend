<template>
  <div class="h-full bg-white flex flex-col">
    <!-- 헤더: 뒤로가기 + 다시 시작 -->
    <div class="flex items-center justify-between h-[50px] px-5 shrink-0">
      <button class="p-1 -ml-1" aria-label="뒤로" @click="onBack">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <button
        class="text-body2 font-semibold text-grey-7 disabled:opacity-40"
        :disabled="isBusy"
        @click="onRestartClick"
      >
        다시 시작
      </button>
    </div>

    <!-- 대화 영역 -->
    <div ref="scrollEl" class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pb-4">
      <div class="flex flex-col">
        <template v-for="(msg, i) in messages" :key="msg.id">
          <!-- 디닷 질문 -->
          <div
            v-if="msg.role === 'didit'"
            class="chat-in flex flex-col gap-2 items-start w-[280px]"
            :class="{ 'mt-5': i > 0 }"
          >
            <!-- Question N/4 -->
            <div v-if="msg.questionNo" class="flex gap-1 items-start pt-2.5 text-caption1">
              <span class="font-semibold text-grey-13">Question</span>
              <span class="flex items-center">
                <span class="font-semibold text-grey-13">{{ msg.questionNo }}</span>
                <span class="font-normal text-grey-6">/{{ TOTAL_QUESTIONS }}</span>
              </span>
            </div>
            <!-- 질문 버블 -->
            <div class="bg-grey-3 rounded-3xl px-5 py-3.5 w-full flex flex-col gap-1">
              <p class="text-body2 font-semibold text-grey-13 whitespace-pre-line">{{ msg.typedMain }}</p>
              <p v-if="msg.sub && msg.showSub" class="text-label2-reading text-grey-8 whitespace-pre-line">{{ msg.sub }}</p>
              <!-- 심화질문 스킵 -->
              <div v-if="msg.skippable && msg.id === lastDeepId && msg.showSub" class="flex justify-end pt-1">
                <button
                  class="bg-accent rounded-lg px-3 py-1.5 text-label2 font-medium text-grey-1 disabled:opacity-40"
                  :disabled="isBusy"
                  @click="onSkipDeep"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>

          <!-- 심화질문 생성 중 (버블 아님: 초록 스피너 + 텍스트, figma 24371) -->
          <div v-else-if="msg.role === 'generating'" class="chat-in flex items-center gap-[10px] mt-5">
            <span class="spinner shrink-0" />
            <span class="text-label1 font-medium text-grey-13">심화 질문을 생성 중이에요...</span>
          </div>

          <!-- 사용자 답변 -->
          <div v-else class="chat-in flex flex-col items-end mt-3.5">
            <div class="bg-grey-12 rounded-3xl px-5 py-3.5 w-[280px]">
              <p
                class="text-body3 text-grey-1 whitespace-pre-line"
                :class="{ 'line-clamp-[7]': isLong(msg.text) }"
              >
                {{ msg.text }}
              </p>
              <!-- 200자 초과 시 전체보기 → 풀스크린 모달 (CHAT_006) -->
              <button
                v-if="isLong(msg.text)"
                class="flex items-center gap-[5px] pt-3 ml-auto text-primary"
                @click="openFullView(msg)"
              >
                <span class="text-label2 font-semibold">전체 보기</span>
                <svg class="w-[10px] h-[18px]" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6.5 9L3 13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 입력 바 -->
    <div
      class="px-5 pt-2.5 bg-grey-1 shrink-0"
      style="padding-bottom: max(16px, env(safe-area-inset-bottom, 16px))"
    >
      <!-- figma: padding 10/8/10/20, gap 15, radius 22. 여러 줄이면 전송 버튼이 하단 정렬 -->
      <div class="flex items-end gap-[15px] bg-grey-3 rounded-[22px] pl-5 pr-2 py-2.5">
        <textarea
          ref="inputEl"
          v-model="inputText"
          rows="1"
          placeholder="회고를 입력하세요"
          class="flex-1 bg-transparent resize-none outline-none text-body3 text-grey-13 placeholder:text-grey-7 max-h-[120px] min-h-7 py-[3px] scrollbar-hide leading-[1.5]"
          :disabled="isBusy || isInputDisabled || typing"
          @input="autoGrow"
          @keydown.enter.exact="onEnterKey"
        />
        <!-- 음성 입력(네이티브 전용) — voice.svg는 28px 원형 배경+글리프 포함 -->
        <button v-if="showVoice" class="shrink-0" aria-label="음성 입력" @click="onVoice">
          <img src="/icons/voice.svg" alt="" class="w-7 h-7" />
        </button>
        <!-- 전송 (빈 값이어도 탭 가능 → 토스트, CHAT_007) -->
        <button
          v-else
          class="bg-grey-13 rounded-full w-7 h-7 flex items-center justify-center shrink-0"
          aria-label="전송"
          @click="onSend"
        >
          <Icon name="famicons:arrow-up-sharp" class="w-4 h-4 text-grey-1" />
        </button>
      </div>
    </div>

    <!-- 나가기 확인 (CHAT_008: 답변 전/후 문구 다름) -->
    <UiPopup
      v-model="showExitPopup"
      title="지금 나가시겠어요?"
      :description="exitDescription"
      confirm-text="나가기"
      cancel-text="취소"
      variant="destructive"
      @confirm="onConfirmExit"
    />

    <!-- 다시 시작 확인 (CHAT_009) -->
    <UiPopup
      v-model="showRestartPopup"
      title="다시 시작하시겠어요?"
      description="지금까지 작성한 내용은 모두 삭제되며, 오늘 회고 횟수 1회가 차감돼요."
      confirm-text="다시 시작"
      cancel-text="취소"
      @confirm="onConfirmRestart"
    />

    <!-- 내 답변 전체보기 (풀스크린, CHAT_006 / figma 24498): 질문 + 답변 전문 -->
    <Teleport to="#app-container">
      <div v-if="fullView" class="absolute inset-0 z-50 bg-grey-1 flex flex-col">
        <!-- 헤더: 뒤로가기만 -->
        <div class="flex items-center h-[50px] px-5 shrink-0">
          <button class="p-1 -ml-1" aria-label="뒤로" @click="fullView = null">
            <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto scrollbar-hide px-5 pb-10">
          <div class="flex flex-col gap-5">
            <!-- 질문 -->
            <div class="flex flex-col gap-2">
              <div v-if="fullView.questionNo" class="flex gap-1 items-start pt-2.5 text-caption1">
                <span class="font-semibold text-grey-13">Question</span>
                <span class="flex items-center">
                  <span class="font-semibold text-grey-13">{{ fullView.questionNo }}</span>
                  <span class="font-normal text-grey-6">/{{ TOTAL_QUESTIONS }}</span>
                </span>
              </div>
              <p class="text-heading2 font-semibold text-grey-13 leading-[1.4]">{{ fullView.question }}</p>
            </div>
            <!-- 답변 전문 -->
            <p class="text-body3-reading text-grey-10 whitespace-pre-line">{{ fullView.answer }}</p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 마이크 권한 안내 (figma 4374-17929) -->
    <Teleport to="#app-container">
      <Transition name="mic-fade">
        <div v-if="showMicPopup" class="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div class="absolute inset-0 bg-black/40" @click="showMicPopup = false" />
          <div class="relative w-full max-w-[300px] bg-grey-1 rounded-2xl px-5 py-4 flex flex-col gap-[14px]">
            <div class="flex flex-col items-center gap-2 py-3 text-center">
              <p class="text-[17px] font-semibold text-grey-13 leading-[1.4] tracking-[-0.02em]">
                디딧(didit)이(가)<br />마이크에 접근하려고 합니다.
              </p>
              <p class="text-[14px] font-normal text-grey-8 leading-[1.6] tracking-[-0.02em]">
                회고를 음성으로 기록하기 위해<br />마이크 접근 권한이 필요해요.
              </p>
            </div>
            <div class="flex gap-2 pb-1">
              <button
                class="flex-1 h-[50px] rounded-xl border border-grey-5 bg-grey-1 text-[15px] font-semibold text-grey-13 active:bg-grey-3 transition-colors"
                @click="showMicPopup = false"
              >
                허용 안 함
              </button>
              <button
                class="flex-1 h-[50px] rounded-xl bg-primary text-[15px] font-semibold text-grey-13 active:opacity-80 transition-opacity"
                @click="onMicAllow"
              >
                허용
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 음성 레코더 (figma 2225-7905) -->
    <RetrospectVoiceRecorder v-if="showRecorder" @done="onRecorderDone" @cancel="onRecorderCancel" />

    <!-- 음성 → 텍스트 변환 중 (figma 2229-8319) -->
    <Teleport to="#app-container">
      <div v-if="isTranscribing" class="absolute inset-0 z-[70] bg-black/40 flex items-center justify-center px-10">
        <div class="bg-grey-1 rounded-2xl w-full max-w-[300px] flex flex-col items-center gap-4 px-5 py-8">
          <span class="spinner" />
          <div class="flex flex-col items-center gap-1.5 text-center">
            <p class="text-body1 font-semibold text-grey-13 leading-[1.4]">
              {{ nickname || '회고' }}님의 음성 회고를<br />텍스트로 변환하고 있어요
            </p>
            <p class="text-label1 font-normal text-grey-8">잠시만 기다려 주세요!</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { QuestionType } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: false })

// 회고 진행 = 3개 기본 질문 + 1개 AI 심화질문 (디자인 기준 /4)
// TODO(백엔드 확인): 기본 질문 개수가 고정 3개인지, 심화질문이 항상 1개인지 확정 필요
const TOTAL_QUESTIONS = 4

type ChatMessage =
  | {
      id: number
      role: 'didit'
      questionNo: number | null
      main: string
      sub?: string
      skippable?: boolean
      typedMain: string // 타이핑으로 점차 노출되는 본문
      showSub: boolean // 본문 타이핑 완료 후 가이드/스킵 노출
    }
  | { id: number; role: 'generating' }
  | { id: number; role: 'user'; text: string }
type DiditMessage = Extract<ChatMessage, { role: 'didit' }>

const retro = useRetrospect()
const { show } = useToast()
const { track } = useAmplitude()
const { isNative } = useIsNative()

const retrospectiveId = ref('')
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isBusy = ref(false) // API 호출 중(질문 전환/완료) — 입력·전송 잠금
const isInputDisabled = ref(false) // 더 이상 입력받지 않는 상태(완료 진행 등)
const typing = ref(false) // 질문 타이핑 애니메이션 중 — 입력 잠금 (CHAT_001)
const questionNo = ref(0) // 화면에 표시한 질문 순번
const deepAsked = ref(false) // 심화질문을 이미 1회 노출했는지(중복 폴링 방지)
const lastDeepId = ref<number | null>(null) // 마지막 심화질문 메시지 id(스킵 버튼 노출 대상)

// 앰플리튜드 분석용 — 회고 시작 시각/심화질문 노출·스킵 여부 추적
const startedAt = ref(0)
const deepShown = ref(false) // 심화질문이 실제로 화면에 노출됐는지
const deepSkipped = ref(false) // 심화질문을 스킵했는지

const showExitPopup = ref(false)
const showRestartPopup = ref(false)

// 음성 입력(STT) — 웹·네이티브 모두 지원
const showMicPopup = ref(false) // 마이크 권한 안내 팝업 (CHAT_001)
const micExplained = ref(false) // 안내 팝업을 이미 거쳤는지
const showRecorder = ref(false) // 녹음 레코더 노출
const isTranscribing = ref(false) // 음성 → 텍스트 변환 중
// 닉네임은 authoritative한 프로필에서 사용 (홈과 동일 — /api/v2/home 의 stale nickname 미사용)
const { profile, load: loadProfile } = useProfile()
const nickname = computed(() => profile.value?.nickname ?? '')
// 전체보기 모달: 답변과 그에 해당하는 질문을 함께 표시
const fullView = ref<{ questionNo: number | null; question: string; answer: string } | null>(null)

const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

let uid = 0
const nextId = () => ++uid

// 답변을 1회라도 전송했는지 — 회고 횟수 차감/팝업 문구 분기 (CHAT_008/009)
const hasAnswered = computed(() => messages.value.some((m) => m.role === 'user'))
// 음성 입력(STT)은 웹·네이티브 모두 노출. getUserMedia 미지원(비보안 컨텍스트 등)이면 숨김.
const voiceSupported = computed(
  () => isNative.value || (import.meta.client && !!navigator.mediaDevices?.getUserMedia),
)
const showVoice = computed(() => voiceSupported.value && inputText.value.trim().length === 0)
const exitDescription = computed(() =>
  hasAnswered.value
    ? '지금까지 작성한 내용은 저장되지 않으며, 오늘 회고 횟수 1회가 차감돼요.'
    : '작성한 내용이 없어 저장되지 않아요.',
)

// 200자 초과 시 '전체 보기' 노출 (CHAT_006)
function isLong(text: string) {
  return text.length > 200
}

// 전체보기 모달 열기 — 해당 답변 바로 앞의 질문을 함께 표시
function openFullView(answerMsg: ChatMessage) {
  if (answerMsg.role !== 'user') return
  const idx = messages.value.findIndex((m) => m.id === answerMsg.id)
  let q: Extract<ChatMessage, { role: 'didit' }> | null = null
  for (let i = idx - 1; i >= 0; i--) {
    const m = messages.value[i]
    if (m.role === 'didit') {
      q = m
      break
    }
  }
  fullView.value = {
    questionNo: q?.questionNo ?? null,
    question: q?.main ?? '',
    answer: answerMsg.text,
  }
}

function scrollToBottom() {
  nextTick(() => {
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  })
}

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

// 질문 순번 계산: questionType('Q1'..)에서 숫자 추출, 없으면 카운터 증가
function resolveQuestionNo(type: QuestionType | null): number {
  const parsed = type ? Number.parseInt(type.replace(/\D/g, ''), 10) : NaN
  questionNo.value = Number.isNaN(parsed) ? questionNo.value + 1 : parsed
  return questionNo.value
}

// 질문 타입별 가이드 보조문구 — API는 질문 본문만 내려주므로 프론트에서 매핑 (심화질문 Q4_DEEP은 가이드 없음)
const QUESTION_GUIDES: Record<string, string> = {
  Q1: '오늘 진행한 일 중 하나를 떠올려, 작업 내용과\n함께 결과나 상태도 같이 적어보세요.',
  Q2: '새롭게 해 본 방법이나, 잘 풀리지 않았던 순간을\n떠올려 보세요. 작은 부분도 괜찮아요.',
  Q3: '다음에 적용해보고 싶은 생각이나 방법을 떠올려 보세요.',
}

function pushQuestion(type: QuestionType | null, content: string, skippable = false) {
  const id = nextId()
  const sub = type ? QUESTION_GUIDES[type] : undefined
  const msg: DiditMessage = {
    id,
    role: 'didit',
    questionNo: resolveQuestionNo(type),
    main: content,
    sub,
    skippable,
    typedMain: '',
    showSub: false,
  }
  messages.value.push(msg)
  if (skippable) lastDeepId.value = id
  scrollToBottom()
  // 반응형 배열의 프록시를 변경해야 글자 단위 타이핑이 화면에 반영됨 (raw msg 변경은 미반영 → 전체가 한 번에 뜨던 버그)
  typeQuestion(messages.value[messages.value.length - 1] as DiditMessage)
}

// 질문 본문을 한 글자씩 타이핑 → 완료 후 가이드/스킵 노출. 타이핑 중 입력 잠금. (CHAT_001)
async function typeQuestion(msg: DiditMessage) {
  typing.value = true
  for (let i = 1; i <= msg.main.length; i++) {
    msg.typedMain = msg.main.slice(0, i)
    if (i % 3 === 0) scrollToBottom()
    await delay(28)
  }
  msg.typedMain = msg.main
  msg.showSub = true
  typing.value = false
  scrollToBottom()
}

// 회고 시작 → 첫 질문
async function init() {
  isBusy.value = true
  try {
    const res = await retro.start()
    retrospectiveId.value = res.retrospectiveId
    startedAt.value = Date.now()
    pushQuestion(res.firstQuestionType, res.firstQuestionContent)
  } catch (e: unknown) {
    // 백엔드 ProblemDetail의 detail 메시지(예: "오늘 회고 횟수를 모두 사용했습니다.")를 그대로 노출
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    track('retrospect_start_failed', { reason: detail ?? 'unknown' })
    show(detail ?? '회고를 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
    navigateTo('/home')
  } finally {
    isBusy.value = false
  }
}

// 엔터 전송 — 한글 IME 조합 중(isComposing)에는 전송하지 않음(마지막 글자 누락 방지)
function onEnterKey(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  onSend()
}

async function onSend() {
  if (isBusy.value || isInputDisabled.value || typing.value) return
  const text = inputText.value.trim()
  if (!text) {
    show('답변을 입력해 주세요.') // CHAT_007
    return
  }

  messages.value.push({ id: nextId(), role: 'user', text })
  inputText.value = ''
  scrollToBottom()
  // 값이 비워진 뒤(DOM 업데이트 후) 높이를 다시 계산해야 1줄로 초기화됨
  nextTick(autoGrow)

  isBusy.value = true
  try {
    const res = await retro.answer(retrospectiveId.value, text)
    track('answer_submitted', { question_no: questionNo.value, is_deep: deepShown.value })
    if (res.nextQuestionType === 'Q4_DEEP') {
      // Q3 답변 시 백엔드가 Q4_DEEP(심화질문)을 비동기 생성 → 로딩 후 폴링으로 노출
      await showDeepQuestion()
    } else if (res.nextQuestionContent) {
      // 다음 기본 질문
      pushQuestion(res.nextQuestionType, res.nextQuestionContent)
    } else if (res.isReadyToComplete) {
      // 심화질문 답변까지 끝남 → 완료
      await finish()
    }
  } catch {
    show('답변 전송에 실패했어요. 다시 시도해주세요.')
  } finally {
    isBusy.value = false
  }
}

// 심화질문(Q4_DEEP): 비동기 생성 대기(로딩 버블 + /deep-question 폴링) 후 노출. 생성 실패 시 바로 완료.
async function showDeepQuestion() {
  if (deepAsked.value) {
    await finish()
    return
  }
  deepAsked.value = true

  const loadingId = nextId()
  messages.value.push({ id: loadingId, role: 'generating' })
  scrollToBottom()

  const started = Date.now()
  try {
    // 최대 ~30초 폴링 (1.2초 간격)
    for (let i = 0; i < 25; i++) {
      const res = await retro.getDeepQuestion(retrospectiveId.value)
      if (res.isReady) {
        await waitUntil(started, 1000) // 명세: 생성 중 화면 최소 1초 노출
        removeMessage(loadingId)
        if (res.content) {
          pushQuestion('Q4_DEEP', res.content, true)
          deepShown.value = true
          track('deep_question_shown')
          return
        }
        break
      }
      await delay(1200)
    }
  } catch {
    // 심화질문 생성 실패는 치명적이지 않음 → 완료 단계로
  }
  removeMessage(loadingId)
  await finish()
}

async function onSkipDeep() {
  if (isBusy.value) return
  isBusy.value = true
  try {
    await retro.skipDeepQuestion(retrospectiveId.value)
    deepSkipped.value = true
    track('deep_question_skipped')
    if (lastDeepId.value !== null) {
      const m = messages.value.find((x) => x.id === lastDeepId.value)
      if (m && m.role === 'didit') m.skippable = false
    }
    await finish()
  } catch {
    show('잠시 후 다시 시도해주세요.')
  } finally {
    isBusy.value = false
  }
}

// 회고 완료 → 결과 화면으로 이동 (AI 요약 생성/로딩은 결과 화면에서 처리)
async function finish() {
  isInputDisabled.value = true
  track('retrospect_completed', {
    answer_count: messages.value.filter((m) => m.role === 'user').length,
    deep_question_answered: deepShown.value && !deepSkipped.value,
    duration_sec: startedAt.value ? Math.round((Date.now() - startedAt.value) / 1000) : 0,
  })
  useState<string>('retrospect:completing-id').value = retrospectiveId.value
  await navigateTo('/retrospect/result')
}

function removeMessage(id: number) {
  messages.value = messages.value.filter((m) => m.id !== id)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
// 시작 시점부터 최소 ms가 지나도록 대기
function waitUntil(startedAt: number, minMs: number) {
  const remain = minMs - (Date.now() - startedAt)
  return remain > 0 ? delay(remain) : Promise.resolve()
}

// 음성 버튼 → (최초) 마이크 권한 안내 팝업 → 레코더
function onVoice() {
  if (micExplained.value) showRecorder.value = true
  else showMicPopup.value = true
}
function onMicAllow() {
  micExplained.value = true
  showMicPopup.value = false
  showRecorder.value = true
}
// 녹음 완료 → 음성을 텍스트로 변환해 입력창에 채움(사용자가 검토 후 전송)
async function onRecorderDone(blob: Blob) {
  showRecorder.value = false
  isTranscribing.value = true
  try {
    const text = await retro.transcribe(retrospectiveId.value, blob)
    inputText.value = text
    nextTick(autoGrow)
  } catch {
    show('음성 인식에 실패했어요. 텍스트로 입력해 주세요.')
  } finally {
    isTranscribing.value = false
  }
}
function onRecorderCancel() {
  showRecorder.value = false
}

function onBack() {
  if (messages.value.length === 0) {
    navigateTo('/home')
    return
  }
  showExitPopup.value = true
}

async function onConfirmExit() {
  showExitPopup.value = false
  // 진행 중 회고 정리(PENDING이면 삭제). 베스트에포트라 실패해도 홈 이동.
  try {
    await retro.exit(retrospectiveId.value)
  } catch {
    /* noop */
  }
  navigateTo('/home')
}

// 다시 시작: 답변 전이면 무동작(초기 상태 유지·차감 없음), 답변 후에만 확인 팝업 (CHAT_009)
function onRestartClick() {
  if (isBusy.value) return
  if (!hasAnswered.value) return
  showRestartPopup.value = true
}

async function onConfirmRestart() {
  showRestartPopup.value = false
  if (isBusy.value) return
  isBusy.value = true
  try {
    // 기존 회고 삭제 + 새 회고 시작(첫 질문 반환). 홈 이동 없이 화면 내 재시작.
    const res = await retro.restart(retrospectiveId.value)
    retrospectiveId.value = res.retrospectiveId
    messages.value = []
    inputText.value = ''
    questionNo.value = 0
    deepAsked.value = false
    lastDeepId.value = null
    isInputDisabled.value = false
    fullView.value = null
    pushQuestion(res.firstQuestionType, res.firstQuestionContent)
  } catch {
    show('다시 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isBusy.value = false
  }
}

onMounted(() => {
  loadProfile()
  init()
})
</script>

<style scoped>
.spinner {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: 3px solid theme('colors.green.light-active');
  border-top-color: theme('colors.primary');
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 채팅 메시지 등장: 아래에서 위로 + 페이드인 */
.chat-in {
  animation: chatIn 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes chatIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 마이크 권한 팝업 페이드 */
.mic-fade-enter-active { transition: opacity 0.2s ease; }
.mic-fade-leave-active { transition: opacity 0.15s ease; }
.mic-fade-enter-from,
.mic-fade-leave-to { opacity: 0; }
</style>

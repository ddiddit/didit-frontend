<template>
  <div
    class="relative h-full bg-white flex flex-col overflow-hidden"
    :style="keyboardOpen ? { height: `calc(100% - ${keyboardHeight}px)` } : undefined"
  >
    <!-- 헤더 영역 -->
    <RetroHeader :title="'회고 마치기'" :is-busy="isBusy" />

    <!-- 대화 영역 -->
    <div class="message_wrapper h-[calc(100%-112px)] overflow-y-auto">
      <div class="message_area px-[20px] pt-[20px] flex flex-col" v-for="(m, i) in messages" :key="m.id">
        <div class="didit_message_wrapper self-start" v-if="m.role === 'didit'">
          <div class="didit_profile flex flex-col">
            <img src="/icons/icon_chat_didit.png" alt="디딧" class="w-6 h-6" />
            <div class="didit_message_box mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] self-start">
              {{ m.typedMain }}
            </div>
            <Transition name="sub-bubble">
              <div v-if="m.showSub" class="didit_sub_message_box mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] whitespace-pre-line self-start">
                {{ m.sub }}
              </div>
            </Transition>
          </div>
        </div>
        <div class="didit_message_wrapper self-start" v-else-if="m.role === 'generating'">
          <div class="didit_profile flex flex-col">
            <img src="/icons/icon_chat_didit.png" alt="디딧" class="w-6 h-6" />
            <div class="didit_message_box mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] self-start text-grey-7">
              {{ m.text || '심화 질문을 만들고 있어요…' }}
            </div>
          </div>
        </div>
        <div class="user_message_box self-end max-w-[350px] box-border p-[10px] bg-grey-13 rounded-lg text-grey-1 text-[14px]" v-else-if="m.role === 'user'">
          {{ m.text }}
        </div>
      </div>
    </div>

    <!-- 입력 영역 -->
    <RetroTextarea
      :retrospectId="retrospectiveId"
      :saveAnswer="saveAnswer"
      :nextQuestion="nextQuestion"
      :setGenerating="setGenerating"
      :completeRetro="completeRetro"
    />
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'
import type { QuestionType, CompleteRetrospectiveResponse } from '~/types/api'
import { getApiErrorCode, getApiErrorMessage, isAuthError } from '~/utils/api-error'

import RetroHeader from '~/components/layout/RetroHeader.vue'
import RetroTextarea from '~/components/layout/RetroTextarea.vue'

definePageMeta({ middleware: 'auth', layout: false })

export type ChatMessage =
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
  | { id: number; role: 'generating'; text?: string }
  | { id: number; role: 'user'; text: string }

// 메시지 고유 id 생성기 — 렌더 key로 쓰므로 push 마다 증가값 부여
let messageId = 0
function uid() {
  return (messageId += 1)
}

const retro = useRetrospect()
const { show } = useToast()
const { isNative } = useIsNative()

const retrospectiveId = ref('')
const messages = ref<ChatMessage[]>([])
const isBusy = ref(false) // API 호출 중(질문 전환/완료) — 입력·전송 잠금
const questionNo = ref(0) // 화면에 표시한 질문 순번

// 앰플리튜드 분석용 — 회고 시작 시각/심화질문 노출·스킵 여부 추적
const startedAt = ref(0)
const { profile, load: loadProfile } = useProfile()
const nickname = computed(() => profile.value?.nickname ?? '')

const scrollEl = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  })
}

// didit 메시지 본문(main)을 delay 간격으로 한 글자씩 typedMain에 채우고,
// 완료되면 가이드/스킵(showSub)을 노출한다.
const typingTimers: ReturnType<typeof setInterval>[] = []

function typeDiditMessage(msg: Extract<ChatMessage, { role: 'didit' }>, delay = 50) {
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
    }
  }, delay)
  typingTimers.push(timer)
}

// 질문 순번 계산: questionType('Q1'..)에서 숫자 추출, 없으면 카운터 증가
function resolveQuestionNo(type: QuestionType | null): number {
  const parsed = type ? Number.parseInt(type.replace(/\D/g, ''), 10) : NaN
  questionNo.value = Number.isNaN(parsed) ? questionNo.value + 1 : parsed
  return questionNo.value
}

// 질문 타입별 가이드 보조문구 — API는 질문 본문만 내려주므로 프론트에서 매핑 (심화질문 Q4_DEEP은 가이드 없음)
const QUESTION_GUIDES: Record<string, string> = {
  Q1: '잘된 일, 막혔던 일, 정리되지 않은 생각 모두 자\n유롭게 이야기해주세요.',
  Q2: '새롭게 해 본 방법이나, 잘 풀리지 않았던 순간을\n떠올려 보세요. 작은 부분도 괜찮아요.',
  Q3: '다음에 적용해보고 싶은 생각이나 방법을 떠올려 보세요.',
}


// 회고 시작 → 첫 질문
let initCalled = false
async function init() {
  if (initCalled) return // onMounted 중복 실행 등으로 회고가 2개 생성되는 것 방지
  initCalled = true
  isBusy.value = true
  try {
    const res = await retro.start()
    console.log('회고 시작 retrospectiveId:', res.retrospectiveId)
    retrospectiveId.value = res.retrospectiveId
    startedAt.value = Date.now()
    messages.value.push({
      id: uid(),
      role: 'didit',
      questionNo: resolveQuestionNo(res.firstQuestionType),
      main: res.firstQuestionContent,
      typedMain: '',
      showSub: false,
      sub: QUESTION_GUIDES[res.firstQuestionType],
      skippable: false,
    })
    // push된 반응형 객체를 다시 받아 타이핑 시작 (로컬 원본은 반응형이 아님)
    const added = messages.value[messages.value.length - 1]
    if (added?.role === 'didit') typeDiditMessage(added)
  } catch (e) {
    if (isAuthError(e)) return // 인증 만료 → 로그인 이동, 배너 X
    show(getApiErrorMessage(e, '회고를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'))
  } finally {
    isBusy.value = false
  }
}

// 질문에 대한 답장 저장하기
function saveAnswer(text: string) {
  messages.value.push({
    id: uid(),
    role: 'user',
    text
  })
}

// 답장 저장 후 다음 질문 저장 및 타입 애니메이션 실행
// skippable: 심화질문(Q4_DEEP)만 true — 스킵 버튼 노출 대상
function nextQuestion(questionType: string, content: string, skippable = false) {
  messages.value.push({
    id: uid(),
    role: 'didit',
    questionNo: resolveQuestionNo(questionType),
    main: content,
    typedMain: '',
    sub: QUESTION_GUIDES[questionType],
    showSub: false,
    skippable
  })
  console.log(messages)
  // push된 반응형 객체를 다시 받아 타이핑 시작 (로컬 원본은 반응형이 아님)
  const added = messages.value[messages.value.length - 1]
  if (added?.role === 'didit') typeDiditMessage(added)
}

// 심화질문 생성 중 로딩 버블 토글 (RetroTextarea가 /deep-question 폴링하는 동안 노출)
const generatingId = ref<number | null>(null)
function setGenerating(on: boolean) {
  if (on) {
    if (generatingId.value !== null) return
    const id = uid()
    generatingId.value = id
    messages.value.push({ id, role: 'generating' })
    scrollToBottom()
  } else {
    if (generatingId.value === null) return
    messages.value = messages.value.filter((m) => m.id !== generatingId.value)
    generatingId.value = null
  }
}

// 회고 완료 단계 진입 (심화질문 스킵·생성 실패 또는 isReadyToComplete)
// 결과 화면이 completingId를 보고 retro.complete()로 제목/요약을 생성한다.
const completingId = useState<string>('retrospect:completing-id')
async function completeRetro() {
  if (isBusy.value) return
  isBusy.value = true
  const loadingId = uid()
  messages.value.push({ id: loadingId, role: 'generating', text: '회고 결과를 정리하고 있어요…' })
  scrollToBottom()
  try {
    // 심화질문을 건너뛴 경우 백엔드 상태 전이를 위해 skip 호출 (이미 완료 가능 상태면 무시됨)
    await retro.skipDeepQuestion(retrospectiveId.value).catch(() => {})
    completingId.value = retrospectiveId.value
    await navigateTo('/retrospect/result')
  } catch (e) {
    messages.value = messages.value.filter((m) => m.id !== loadingId)
    if (isAuthError(e)) return // 인증 만료 → 로그인 이동
    show(getApiErrorMessage(e, '회고를 마치지 못했어요. 잠시 후 다시 시도해 주세요.'))
  } finally {
    isBusy.value = false
  }
}


// [iOS 전용] iOS는 리사이즈 모드 none(keyboard.client.ts)이라 키보드가 떠도 레이아웃이
// 줄지 않아, OS가 알려주는 키보드 전체 높이(추천줄·툴바 포함)만큼 화면을 JS로 줄인다.
// (visualViewport는 추천줄 높이를 누락하므로 네이티브 키보드 높이를 쓴다)
// 안드로이드는 adjustResize(capacitor.config resize 'body')로 WebView 자체가 줄어 JS 보정 불필요.
const keyboardOpen = ref(false)
const keyboardHeight = ref(0)
let kbShow: PluginListenerHandle | undefined
let kbDidShow: PluginListenerHandle | undefined
let kbHide: PluginListenerHandle | undefined

function applyKeyboardHeight(raw: number) {
  // 일부 기기는 물리 px로 주므로 CSS px로 정규화
  const h = raw > window.innerHeight ? raw / window.devicePixelRatio : raw
  keyboardHeight.value = h > 0 ? h : 0
  keyboardOpen.value = keyboardHeight.value > 0
}

onMounted(async () => {
  // 유저 정보 로드
  loadProfile()

  // 초기화 - 첫 회고 질문 불러오기 (질문 push 후 typeDiditMessage로 타이핑 시작)
  init()

  if (!import.meta.client || !isNative.value) return
  if (Capacitor.getPlatform() === 'ios') {
    kbShow = await Keyboard.addListener('keyboardWillShow', info => applyKeyboardHeight(info.keyboardHeight))
    kbHide = await Keyboard.addListener('keyboardWillHide', () => { keyboardHeight.value = 0; keyboardOpen.value = false })
  }
  // 키보드가 다 올라온 뒤(레이아웃 축소 완료) 채팅을 맨 아래로 → 마지막 질문이 키보드에 가려지지 않음 (iOS·AOS 공통)
  kbDidShow = await Keyboard.addListener('keyboardDidShow', () => scrollToBottom())
})

onUnmounted(() => {
  typingTimers.forEach(clearInterval)
  kbShow?.remove()
  kbDidShow?.remove()
  kbHide?.remove()
})
</script>

<style scoped>
/* 가이드 말풍선 등장 애니메이션 — 아래에서 살짝 떠오르며 페이드인 */
.sub-bubble-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.sub-bubble-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
</style>

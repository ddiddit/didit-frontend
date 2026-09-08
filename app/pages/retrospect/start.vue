<template>
  <div
    class="relative h-full bg-white flex flex-col overflow-hidden"
    :style="keyboardOpen ? { height: `calc(100% - ${keyboardHeight}px)` } : undefined"
  >
    <!-- 헤더 영역 -->
    <RetroHeader :title="'회고 마치기'" :isBusy="isBusy" :onBack="onBack" />

    <!-- 뒤로가기 모달 -->
    <UiPopup :modelValue="isBackModal" :title="'뒤로가기'" description="뒤로가기 하시겠습니까?" :onConfirm="onBackConfirm" :onCancel="onBackCancel" />

    <!-- 마이크 접근 모달 — 권한이 아직 없을 때만. 이미 허용된 경우 accessMic()에서 바로 레코더를 연다 -->
    <UiPopup :modelValue="isAccessMicModal" :title="'디딧(didit)이(가) 마이크에 접근하려고 합니다.'" :description="'회고를 음성으로 기록하기 위해 마이크 접근 권한이 필요해요.'" :confirmText="'허용'" :cancelText="'허용 안 함'" :loading="micRequesting" @cancel="isAccessMicModal = false" @confirm="confirmAccessMic" />

    <!-- 음성 레코더 (녹음 중 파형·타이머, 엔터로 STT 변환) -->
    <RetrospectVoiceRecorder v-if="isRecorderOpen" :retrospectiveId="retrospectiveId" @done="onVoiceDone" @cancel="isRecorderOpen = false" @blocked="onVoiceBlocked" />

    <!-- 대화 영역 -->
    <div class="message_wrapper h-[calc(100%-112px)] overflow-y-auto">
      <div class="message_area px-[20px] pt-[20px] flex flex-col" v-for="(m, i) in messages" :key="m.id">
        <div class="didit_message_wrapper self-start" v-if="m.role === 'didit'">
          <div class="didit_profile flex flex-col mb-[20px]">
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
            <div class="didit_message_box mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-flex items-center gap-[6px] text-[14px] rounded-[24px] self-start text-grey-7">
              <!-- 심화 질문 생성 대기(= m.text 없음)일 땐 텍스트 없이 로티만, 그 외(결과 정리 등)엔 텍스트 -->
              <DotLottieVue v-if="!m.text" class="w-5 h-5 shrink-0" autoplay loop :src="DEEP_QUESTION_LOTTIE" />
              <span v-else>{{ m.text }}</span>
            </div>
          </div>
        </div>
        <RetroUserMessage v-else-if="m.role === 'user'" :text="m.text" />
      </div>
    </div>

    <!-- 입력 영역 -->
    <RetroTextarea
      :retrospectId="retrospectiveId"
      :saveAnswer="saveAnswer"
      :nextQuestion="nextQuestion"
      :accessMic="accessMic"
      :messages="messages"
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

import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

import RetroHeader from '~/components/layout/RetroHeader.vue'
import RetroTextarea from '~/components/layout/RetroTextarea.vue'
import RetroUserMessage from '~/components/layout/RetroUserMessage.vue'
import RetrospectVoiceRecorder from '~/components/RetrospectVoiceRecorder.vue'

definePageMeta({ middleware: ['auth', 'no-direct-entry'], layout: false })

// 심화 질문 생성 로딩 로티 (.lottie). public/lottie/ 에 파일을 두거나 호스팅 URL로 교체.
const DEEP_QUESTION_LOTTIE = '/icons/loading.lottie'

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
// 마이크 권한 요청·상태 판정은 음성 레코더 컴포저블과 동일 로직을 재사용
const {
  requestPermission: requestMicPermission,
  isPermissionBlocked: isMicPermissionBlocked,
  isPermissionGranted: isMicPermissionGranted,
} = useVoiceRecorder()

const retrospectiveId = ref('')
const messages = ref<ChatMessage[]>([])
const isBackModal = ref(false) // 뒤로가기 모달 표시 여부
const isBusy = ref(false) // API 호출 중(질문 전환/완료) — 입력·전송 잠금
const questionNo = ref(0) // 화면에 표시한 질문 순번
const isAccessMicModal = ref(false) // 마이크 접근 모달 여부
const micRequesting = ref(false) // 권한 요청 진행 중 — '허용' 버튼 잠금
const isRecorderOpen = ref(false) // 음성 레코더 표시 여부
// 음성 레코더가 변환한 텍스트를 입력창(RetroTextarea)으로 넘기는 초안 채널
const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')

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

// 뒤로 가기 모달 재생
function onBack() {
  if(isBusy.value) {
    return
  }
  isBackModal.value = true
}

// 뒤로 가기 확인
function onBackConfirm() {
  navigateTo("/home")
}

// 뒤로 가기 취소
function onBackCancel() {
  isBackModal.value = false
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
  Q4_DEEP: '오늘 회고 내용은 충분해요\n지금까지 나눈 내용을 정리해볼까요?'
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

// 마이크 버튼 — 권한이 이미 허용돼 있으면 접근 모달을 건너뛰고 바로 레코더를 연다.
// (Permissions API 미지원 환경은 항상 접근 모달을 거쳐 requestPermission으로 처리)
async function accessMic() {
  if (await isMicPermissionGranted()) {
    isRecorderOpen.value = true
    return
  }
  isAccessMicModal.value = true
}

// 마이크 접근 모달 '허용' — 웹은 브라우저 권한 다이얼로그, 네이티브는 OS 권한 요청을 띄운다.
// 성공하면 레코더를 열고, 영구 거부('denied')면 설정 화면으로 유도, 그 외(1회 거부·장치 없음)엔 안내만 한다.
async function confirmAccessMic() {
  if (micRequesting.value) return
  micRequesting.value = true
  try {
    const granted = await requestMicPermission()
    isAccessMicModal.value = false
    if (granted) {
      isRecorderOpen.value = true
      return
    }
    if (await isMicPermissionBlocked()) {
      await openMicSettings()
    } else {
      show('마이크 권한이 필요해요. 다시 시도해 주세요.')
    }
  } finally {
    micRequesting.value = false
  }
}

// STT 변환 완료 — 레코더를 닫고, 변환된 텍스트를 입력창 초안으로 넘긴다 (전송은 사용자가 직접).
function onVoiceDone(text: string) {
  isRecorderOpen.value = false
  const trimmed = text.trim()
  if (trimmed) voiceTranscript.value = trimmed
}

// 레코더 진입 시점에 권한이 영구 거부로 바뀐 경우 — 설정으로 유도
function onVoiceBlocked() {
  isRecorderOpen.value = false
  openMicSettings()
}

// 마이크 권한이 영구 거부된 경우 — 네이티브는 앱 설정 화면, 웹은 안내 문구로 대체.
async function openMicSettings() {
  if (isNative.value) {
    await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    })
  } else {
    show('브라우저 주소창의 사이트 설정에서 마이크 접근을 허용해 주세요.')
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

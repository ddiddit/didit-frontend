<template>
  <div
    class="relative h-full flex flex-col overflow-clip bg-retro-fade"
    :style="keyboardOpen ? { height: `calc(100% - ${keyboardHeight}px)` } : undefined"
  >
    <!-- 헤더 영역 — 오른쪽 '회고 마치기'는 응답 대기 중·마치기 처리 중에만 잠기고, 그 외에는 언제나 누를 수 있다 -->
    <RetroHeader :title="'회고 마치기'" :isBusy="isBusy" :finishDisabled="isBusy || isFinishing" :onBack="onBack" :onFinish="onFinishClick" />

    <!-- 마이크 접근 모달 — 권한이 아직 없을 때만. 이미 허용된 경우 accessMic()에서 바로 레코더를 연다 -->
    <UiPopup :modelValue="isAccessMicModal" :title="'디딧(didit)이(가) 마이크에 접근하려고 합니다.'" :description="'회고를 음성으로 기록하기 위해 마이크 접근 권한이 필요해요.'" :confirmText="'허용'" :cancelText="'허용 안 함'" :loading="micRequesting" @cancel="isAccessMicModal = false" @confirm="confirmAccessMic" />

    <!-- 뒤로가기 확인 모달 — 답변 여부에 따라 나가기의 실제 결과(마무리 vs 삭제)가 다르므로 문구도 그에 맞게 -->
    <UiPopup :modelValue="isBackModal" :title="backModalTitle" :description="backModalDescription" :confirmText="'나가기'" :cancelText="'계속하기'" :loading="isBackLeaving" @cancel="onBackCancel" @confirm="onBackConfirm" />

    <!-- 회고 마치기 확인 모달 — 실수로 대화를 끝내지 않도록 확인 후 결과를 생성한다 -->
    <UiPopup :modelValue="isFinishModal" :title="'회고를 마칠까요?'" :description="'지금까지의 답변으로 회고 결과를 만들어요.'" :confirmText="'마치기'" :cancelText="'계속하기'" :loading="isFinishing" @cancel="onFinishCancel" @confirm="onFinishConfirm" />

    <!-- 음성 레코더 (녹음 중 파형·타이머, 엔터로 STT 변환) -->
    <RetrospectVoiceRecorder v-if="isRecorderOpen" :retrospectiveId="retrospectiveId" @done="onVoiceDone" @cancel="isRecorderOpen = false" @blocked="onVoiceBlocked" />

    <!-- 대화 영역 -->
    <!-- 고정 높이(calc) 대신 flex-1 — 입력창이 여러 줄·첨부로 커져도 대화 영역이 줄어들 뿐, 헤더가 밀려나지 않는다 -->
    <div ref="scrollEl" class="message_wrapper flex-1 min-h-0 overflow-y-auto">
      <div class="message_area px-[20px] pt-[20px] flex flex-col" v-for="(m, i) in messages" :key="m.id">
        <div class="didit_message_wrapper self-start" v-if="m.role === 'didit'">
          <div class="didit_profile flex flex-col mb-[20px]">
            <img src="/icons/icon_chat_didit.png" alt="디딧" class="w-6 h-6" />
            <div class="didit_message_box mt-[10px] px-[12px] max-w-[250px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] self-start">
              {{ m.typedMain }}
            </div>
            <Transition name="sub-bubble">
              <div v-if="m.showSub" class="didit_sub_message_box mt-[10px] max-w-[250px] px-[12px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] whitespace-pre-line self-start">
                {{ m.sub }}
              </div>
            </Transition>
            <!-- 답변 예시(answerGuide) — 아직 답하지 않은 마지막 질문에만 표시. 예시를 누르면 그 문구를
                 일반 TEXT 메시지로 전송(onSend → 새 clientMessageId)하고, 질문이 마지막이 아니게 되며 사라진다 -->
            <template v-if="m.answerGuide && i === messages.length - 1">
              <UiButton
                v-if="!m.showExamples"
                variant="ghost"
                size="sm"
                class="self-start mt-[10px] px-0"
                @click="m.showExamples = true"
              >
                답변 예시 보기
              </UiButton>
              <div v-else class="flex flex-col items-start gap-[8px] mt-[10px]">
                <button
                  v-for="example in m.answerGuide.examples"
                  :key="example"
                  class="max-w-[250px] px-[12px] py-[10px] rounded-[16px] border border-grey-5 bg-white text-[14px] text-grey-13 text-left disabled:opacity-50"
                  :disabled="isBusy || isFinishing"
                  @click="onSend(example)"
                >
                  {{ example }}
                </button>
              </div>
            </template>
            <!-- 마무리 선택 UI — 답변 응답의 action에 따라 답장과 함께 노출(showCompletionOffer).
                 OFFER_COMPLETION: 계속하기 / 마치기(마무리 의사를 답변으로 전송 → 서버가 CONFIRM_COMPLETION으로 응답)
                 CONFIRM_COMPLETION: 마무리하기(바로 결과 화면으로). 계속하기를 누르거나 답변을 보내면 사라진다 -->
            <div v-if="m.id === completionOffer?.messageId" class="flex gap-[8px] mt-[10px]">
              <template v-if="completionOffer.action === 'OFFER_COMPLETION'">
                <UiButton variant="chip" size="sm" :disabled="isBusy || isFinishing" @click="onOfferContinue">
                  계속하기
                </UiButton>
                <UiButton size="sm" :disabled="isBusy || isFinishing" @click="onOfferFinish">
                  마치기
                </UiButton>
              </template>
              <UiButton v-else size="sm" :loading="isFinishing" :disabled="isBusy" @click="onFinishConfirm">
                마무리하기
              </UiButton>
            </div>
          </div>
        </div>
        <div class="didit_message_wrapper self-start" v-else-if="m.role === 'generating'">
          <div class="didit_profile flex flex-col">
            <img src="/icons/icon_chat_didit.png" alt="디딧" class="w-6 h-6" />
            <!-- 텍스트 없는 자리표시자(답변 후 다음 질문 대기 등)는 로티만 담은 알약형 말풍선 -->
            <!-- 로티 캔버스는 정사각형이고 점 3개가 가운데 띠에만 있어, 캔버스를 크게 두고 말풍선 밖으로 넘치는 여백은 잘라낸다 -->
            <div v-if="!m.text" class="didit_message_box mt-[10px] w-[60px] h-[36px] bg-grey-3 flex items-center justify-center overflow-hidden rounded-full self-start">
              <DotLottieVue class="w-[68px] h-[68px] shrink-0" autoplay loop :src="GENERATING_LOTTIE" />
            </div>
            <!-- 텍스트가 있는 자리표시자(결과 정리 등) -->
            <div v-else class="didit_message_box max-w-[350px] mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-flex items-center gap-[6px] text-[14px] rounded-[24px] self-start text-grey-7">
              <span>{{ m.text }}</span>
            </div>
          </div>
        </div>
        <RetroUserMessage
          v-else-if="m.role === 'user'"
          :text="m.text"
          :attachments="m.attachments"
          :retrospective-id="retrospectiveId"
          @delete-attachment="onDeleteAttachment(m, $event)"
        />
      </div>
    </div>

    <!-- 입력 영역 -->
    <RetroTextarea ref="textareaRef" :disabled="isBusy" :retrospectiveId="retrospectiveId" @send="onSend" @accessMic="accessMic" />
  </div>
</template>

<script setup lang="ts">
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { App } from '@capacitor/app'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

import RetroHeader from '~/components/layout/RetroHeader.vue'
import RetroTextarea from '~/components/layout/RetroTextarea.vue'
import RetroUserMessage from '~/components/layout/RetroUserMessage.vue'
import RetrospectVoiceRecorder from '~/components/RetrospectVoiceRecorder.vue'
import UiPopup from '~/components/ui/UiPopup.vue'
import UiButton from '~/components/ui/UiButton.vue'
import { isServerError } from '~/utils/api-error'
import type { AnswerGuide, AssistantAction } from '~/types/api'
import type { SentAttachment } from '~/utils/attachment'
import type { ConversationCache } from '~/composables/useRetrospect'

definePageMeta({ middleware: ['auth', 'no-direct-entry'], layout: false })

// generating 자리표시자(다음 질문 대기 중)에서 재생할 로티 — public/icons/loading.lottie
const GENERATING_LOTTIE = '/icons/loading.lottie'

// 선택 UI '마치기' — 마무리 의사를 일반 답변으로 보내면 서버가 CONFIRM_COMPLETION(마무리 확인)으로 응답한다
const FINISH_INTENT_MESSAGE = '더 이상 없어요. 이제 마무리할게요'

// 선택 UI를 붙이는 action — 그 외(ASK/REFLECT)에는 붙이지 않는다
type CompletionAction = Extract<AssistantAction, 'OFFER_COMPLETION' | 'CONFIRM_COMPLETION'>

export type ChatMessage =
  | {
      id: string
      role: 'didit'
      main: string
      sub?: string
      skippable?: boolean
      typedMain: string // 타이핑으로 점차 노출되는 본문
      showSub: boolean // 본문 타이핑 완료 후 가이드/스킵 노출
      answerGuide?: AnswerGuide // 답변 예시 안내 (없으면 예시 UI 미표시)
      showExamples: boolean // 답변 예시 펼침 여부 — INLINE은 처음부터 true, ON_DEMAND는 '답변 예시 보기' 클릭 시 true
    }
  | { id: string; role: 'generating'; text?: string }
  | { id: string; role: 'user'; text: string; attachments?: SentAttachment[] }

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
const isBusy = ref(false) // API 호출 중(질문 전환/완료)·AI 메시지 타이핑 중 — 입력·전송·헤더 버튼 잠금

const isAccessMicModal = ref(false) // 마이크 접근 모달 여부
const isBackModal = ref(false) // 뒤로가기 확인 모달 여부
const isBackLeaving = ref(false) // 뒤로가기 확인('나가기') 처리 중(finish 호출) — 버튼 잠금
const isFinishModal = ref(false) // 회고 마치기 확인 모달 여부
const isFinishing = ref(false) // finish() 처리 중 — 결과 화면으로 넘어가는 라우팅 전환까지는 풀지 않는다
// 마무리 선택 UI를 붙일 didit 메시지 — OFFER_COMPLETION이면 '계속하기 / 마치기', CONFIRM_COMPLETION이면 '마무리하기'
const completionOffer = ref<{ messageId: string; action: CompletionAction } | null>(null)
const micRequesting = ref(false) // 권한 요청 진행 중 — '허용' 버튼 잠금
const isRecorderOpen = ref(false) // 음성 레코더 표시 여부
// 음성 레코더가 변환한 텍스트를 입력창(RetroTextarea)으로 넘기는 초안 채널
const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')

// 회고 마치기 시 result.vue로 넘길 대상 회고 id — 결과 생성(finish)은 result.vue의 로딩 화면에서 진행한다
const completingId = useState<string>('retrospect:completing-id')


// 대화 스크롤 영역 — 내용이 늘어날 때(새 메시지, 타이핑 애니메이션 등) 자동으로 바닥까지 따라 내려간다
const scrollEl = ref<HTMLElement | null>(null)
let scrollObserver: MutationObserver | undefined

function scrollToBottom() {
  const el = scrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

// 앰플리튜드 분석용 — 회고 시작 시각/심화질문 노출·스킵 여부 추적
const startedAt = ref(0)
const { profile, load: loadProfile } = useProfile()
const nickname = computed(() => profile.value?.nickname ?? '')

// 입력창 — AI 응답 출력이 끝나거나 종료 선택 UI가 닫히면 바로 작성할 수 있게 포커스를 돌려준다
const textareaRef = ref<InstanceType<typeof RetroTextarea> | null>(null)

// 모달·레코더가 떠 있거나 회고를 마치는 중이면 포커스하지 않는다(모달 위로 키보드가 올라오는 것 방지)
function focusInput() {
  if (isFinishModal.value || isBackModal.value || isAccessMicModal.value || isRecorderOpen.value || isFinishing.value) return
  nextTick(() => textareaRef.value?.focus())
}

// AI 메시지 타이핑(출력)이 끝났을 때 — 입력 잠금을 풀고 입력창에 자동 포커스
function onDiditTyped() {
  isBusy.value = false
  focusInput()
}

// 타이핑 애니메이션 공용 로직 (buildDiditMessage: AI 메시지 → 채팅 말풍선 변환 / typeDiditMessage: 한 글자씩 타이핑)
const { typeDiditMessage, clearTypingTimers } = useDiditTyping()

// AI 메시지를 화면에 띄울 때 함께 호출 — 재진입 시 대화 조회 없이 바로 복구할 수 있게 마지막 AI 메시지를 캐시한다
function cacheLastDiditMessage(message: ConversationCache['message'], readyToComplete: boolean, action: AssistantAction | null = null) {
  saveConversationCache({ retrospectiveId: retrospectiveId.value, message, readyToComplete, action })
}

// 진행 중이던 회고 이어가기 — 이어서 진행할 수 있으면 true.
// 캐시된 마지막 AI 메시지가 있으면 대화 조회 요청 없이 바로 복구하고, 없을 때만(답변 후 응답을 못 받고 나간 경우 등)
// 대화 조회(getConversation)로 복구한다. 조회는 AI 메시지만 내려오고 사용자 답변 텍스트는 포함되지 않아,
// 전체 대화 재구성은 불가능하고 '가장 마지막 질문' 복구만 가능하다.
async function resumeActiveRetrospective(id: string): Promise<boolean> {
  const cached = readConversationCache(id)
  if (cached) {
    restoreDiditMessage(id, cached.message, cached.readyToComplete, cached.action ?? null)
    return true
  }
  try {
    const conversation = await retro.getConversation(id)
    if (conversation.conversationStatus !== 'ACTIVE') return false

    const lastMessage = conversation.messages.at(-1)
    if (!lastMessage) return false

    // 대화 조회 응답엔 action이 없어 선택 UI는 복구하지 않는다(헤더 '회고 마치기'로 종료 가능)
    restoreDiditMessage(id, lastMessage, conversation.readyToComplete, null)
    cacheLastDiditMessage(lastMessage, conversation.readyToComplete)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

// 이미 노출됐던 메시지 복구 — 재진입 시에는 타이핑 애니메이션 없이 바로 전체 노출 (sub이 없으면 노출 안 함)
function restoreDiditMessage(id: string, message: ConversationCache['message'], readyToComplete: boolean, action: AssistantAction | null) {
  retrospectiveId.value = id
  const diditMessage = buildDiditMessage(message, readyToComplete)
  diditMessage.typedMain = diditMessage.main
  diditMessage.showSub = !!diditMessage.sub
  messages.value = [diditMessage]
  showCompletionOffer(diditMessage.id, action)
  focusInput()
}

// 처음 start.vue 페이지에 접근 시 실행할 함수 — 저장된 진행 중 회고 id가 있으면 새로 만들지 않고 이어서 진행
async function initialApplication() {
  try {
    const savedId = localStorage.getItem(ACTIVE_RETROSPECTIVE_KEY)
    if (savedId) {
      if (await resumeActiveRetrospective(savedId)) return
      clearActiveRetrospective() // 유효하지 않은 id — 정리 후 새로 시작
    }

    const first_response = await retro.start()
    if (first_response.conversationStatus !== 'ACTIVE') return;
    retrospectiveId.value = first_response.retrospectiveId
    localStorage.setItem(ACTIVE_RETROSPECTIVE_KEY, first_response.retrospectiveId)
    const diditMessage = buildDiditMessage(first_response.initialMessage)
    messages.value = [diditMessage]
    cacheLastDiditMessage(first_response.initialMessage, first_response.readyToComplete)
    isBusy.value = true
    typeDiditMessage(diditMessage, 50, onDiditTyped)
  } catch(err) {
    console.log(err)
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
  }
}

// 답변을 하나라도 했는지 — 뒤로가기 모달 문구를 뭘로 보여줄지만 여기서 갈린다.
// (저장 여부는 갈리지 않는다 — 나가기는 항상 exit()이고, 저장은 '회고 마치기'를 통해서만 이뤄진다)
const hasAnswered = computed(() => messages.value.some((m) => m.role === 'user'))
const backModalTitle = computed(() => (hasAnswered.value ? '나가면 작성한 내용이 사라져요' : '회고를 종료할까요?'))
const backModalDescription = computed(() =>
  hasAnswered.value
    ? '지금까지 작성한 답변은 저장되지 않아요. 회고를 마치려면 "회고 마치기"를 이용해주세요.'
    : '작성한 내용이 없어 나가면 이 회고는 삭제돼요.',
)

// 헤더 뒤로가기 — 답변 여부와 관계없이 항상 확인 모달을 한 번 더 띄운 뒤에만 나간다.
function onBack() {
  if (isBusy.value) return
  isBackModal.value = true
}

// 뒤로가기 확인('나가기') — 저장 없이 exit()로 정리한다(PENDING이면 삭제). 답변이 있어도 저장하지 않음 —
// 저장(결과 생성)은 '회고 마치기' 버튼(onFinishConfirm/finish())을 통해서만 이뤄진다.
// 실패해도 나가는 것 자체는 막지 않음 — ACTIVE_RETROSPECTIVE_KEY가 남아있으면 다음 진입 시 이어서 진행 가능
async function onBackConfirm() {
  if (isBackLeaving.value) return
  isBackLeaving.value = true
  if (retrospectiveId.value) {
    try {
      await retro.exit(retrospectiveId.value)
      clearActiveRetrospective()
    } catch (err) {
      console.log(err)
    }
  }
  isBackLeaving.value = false
  isBackModal.value = false
  navigateTo('/home')
}

// 뒤로가기 취소 — 모달만 닫고 계속 진행
function onBackCancel() {
  isBackModal.value = false
  focusInput()
}

// 헤더 '회고 마치기' — readyToComplete·action과 관계없이 종료를 차단하지 않고 확인 모달을 띄운다.
// (AI가 마무리를 제안할 때의 '계속하기 / 마치기' 선택은 AI 응답 아래에 붙는다 — showCompletionOffer)
function onFinishClick() {
  if (isBusy.value || isFinishing.value || !retrospectiveId.value) return
  isFinishModal.value = true
}

// 회고 마치기 확인 — 바로 결과 화면(result.vue)으로 넘어가고, 대화 종료·결과 생성(finish)은 그 화면의
// 자동 저장 로딩(최소 1초) 동안 진행한다. 생성이 끝나면 result.vue가 결과를 보여준다.
// (생성에 실패하면 result.vue의 에러 화면에서 재시도 — 재개용 id는 생성 성공 시에만 지워 대화로 돌아와 이어갈 수도 있다)
function onFinishConfirm() {
  if (isFinishing.value || !retrospectiveId.value) return
  // 라우팅 전환 중 버튼이 다시 눌려 중복 이동하지 않도록 isFinishing은 풀지 않는다
  isFinishing.value = true
  isFinishModal.value = false
  completingId.value = retrospectiveId.value
  navigateTo('/retrospect/result')
}

// 회고 마치기 취소 — 모달만 닫고 계속 진행
function onFinishCancel() {
  isFinishModal.value = false
  focusInput()
}

// 선택 UI의 '계속하기' — 선택 UI만 닫고 입력을 이어간다
function onOfferContinue() {
  completionOffer.value = null
  focusInput()
}

// 선택 UI의 '마치기' — 바로 종료하지 않고 마무리 의사를 답변으로 보낸다.
// 서버가 CONFIRM_COMPLETION으로 응답하면 '마무리하기' 버튼이 붙고, 그걸 눌러야 결과 화면으로 넘어간다
function onOfferFinish() {
  onSend(FINISH_INTENT_MESSAGE)
}

// 답변 응답의 action에 따라 AI 답장 아래에 선택 UI를 답장과 동시에 붙인다.
// OFFER_COMPLETION → '계속하기 / 마치기', CONFIRM_COMPLETION → '마무리하기', 그 외(ASK/REFLECT/null) → 붙이지 않음
function showCompletionOffer(messageId: string, action: AssistantAction | null) {
  completionOffer.value =
    action === 'OFFER_COMPLETION' || action === 'CONFIRM_COMPLETION' ? { messageId, action } : null
}

// 답변 제출 — 사용자 메시지를 먼저 반영하고, AI 응답을 기다리는 동안 generating 자리표시자를 보여준 뒤
// 도착하면 didit 메시지로 교체해 타이핑 애니메이션을 시작한다 (배열은 매번 새로 만들어 불변성 유지)
async function onSend(content: string, attachments: SentAttachment[] = []) {
  if (!retrospectiveId.value || isBusy.value) return
  if (!content.trim() && attachments.length === 0) return // 텍스트도 첨부도 없으면 보낼 게 없음
  clearConversationCache() // 답변을 보내면 서버 대화가 바뀌므로 캐시를 지운다 — 응답 전에 나가면 재진입 시 서버에서 조회
  completionOffer.value = null // 선택 없이 답변을 이어 쓰면 '계속하기'로 간주해 선택 UI를 닫는다

  // reactive()로 감싸지 않으면 이후 onDeleteAttachment에서 attachments를 mutate해도 화면이 안 갱신된다
  const userMessage = reactive<ChatMessage>({ id: crypto.randomUUID(), role: 'user', text: content, attachments })
  messages.value = [...messages.value, userMessage]

  const generatingId = crypto.randomUUID()
  // 첨부가 있으면 파일 분석(비동기)을 기다리는 거라 일반 "다음 질문 대기"와 다르게 문구를 보여준다
  messages.value = [
    ...messages.value,
    { id: generatingId, role: 'generating', text: attachments.length ? '첨부파일을 확인하고 있어요' : undefined },
  ]

  isBusy.value = true
  try {
    const attachmentIds = attachments.map((a) => a.attachmentId)
    const response = await retro.answer(retrospectiveId.value, content, attachmentIds)

    if (!response.assistantMessage) {
      if (attachments.length > 0) {
        // 첨부가 있으면 파일 분석이 비동기로 진행 중이라는 뜻 — 해당 턴이 끝날 때까지 대화 조회로 폴링
        pollAnalysisTurn(response.turnId, generatingId)
        return
      }
      // 첨부 없이도 null이 오는 경우(그 외 사유) — generating 자리표시자만 지운다
      messages.value = messages.value.filter((m) => m.id !== generatingId)
      isBusy.value = false
      return
    }

    const diditMessage = buildDiditMessage(response.assistantMessage, response.readyToComplete)
    messages.value = messages.value.map((m) => (m.id === generatingId ? diditMessage : m))
    cacheLastDiditMessage(response.assistantMessage, response.readyToComplete, response.action)
    showCompletionOffer(diditMessage.id, response.action)
    typeDiditMessage(diditMessage, 50, onDiditTyped)
  } catch (err) {
    messages.value = messages.value.filter((m) => m.id !== generatingId)
    isBusy.value = false
    console.log(err)
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    else show('답변을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
  }
}

// 첨부파일 분석 중엔 assistantMessage가 null로 오므로, 대화 조회로 해당 턴(turnId)이
// PENDING(분석 중)에서 COMPLETED/FAILED로 바뀔 때까지 짧은 간격으로 확인한다.
// (읽을 수 없는 파일도 실패로 남지 않고 안내 메시지와 함께 COMPLETED로 끝나므로, FAILED는 진짜 오류일 때만)
let pollTimer: ReturnType<typeof setTimeout> | undefined
const POLL_INTERVAL = 2000
const POLL_MAX_ATTEMPTS = 20 // 대략 40초 — 그 이상 걸리면 안내하고 포기

async function pollAnalysisTurn(turnId: string, generatingId: string, attempt = 0) {
  if (!retrospectiveId.value) return
  try {
    const conversation = await retro.getConversation(retrospectiveId.value)
    const turn = conversation.turns.find((t) => t.id === turnId)

    if (turn?.status === 'COMPLETED') {
      const lastMessage = conversation.messages.at(-1)
      if (!lastMessage) {
        messages.value = messages.value.filter((m) => m.id !== generatingId)
        isBusy.value = false
        return
      }
      const diditMessage = buildDiditMessage(lastMessage, conversation.readyToComplete)
      messages.value = messages.value.map((m) => (m.id === generatingId ? diditMessage : m))
      // 대화 조회 응답엔 action이 없어 첨부 분석 후 답장에는 선택 UI를 붙이지 않는다
      cacheLastDiditMessage(lastMessage, conversation.readyToComplete)
      typeDiditMessage(diditMessage, 50, onDiditTyped)
      return
    }

    if (turn?.status === 'FAILED') {
      messages.value = messages.value.filter((m) => m.id !== generatingId)
      isBusy.value = false
      show('첨부파일을 처리하지 못했어요. 잠시 후 다시 시도해주세요.')
      return
    }

    if (attempt >= POLL_MAX_ATTEMPTS) {
      messages.value = messages.value.filter((m) => m.id !== generatingId)
      isBusy.value = false
      show('분석이 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.')
      return
    }

    pollTimer = setTimeout(() => pollAnalysisTurn(turnId, generatingId, attempt + 1), POLL_INTERVAL)
  } catch (err) {
    console.log(err)
    messages.value = messages.value.filter((m) => m.id !== generatingId)
    isBusy.value = false
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    else show('첨부파일 처리 결과를 확인하지 못했어요. 잠시 후 다시 시도해주세요.')
  }
}

// 전송된 첨부파일 삭제(×) — 일반 첨부는 답변 편집 정책상 서버가 거부하고, 서버가 민감정보를
// 감지해 삭제를 권고한 첨부만 실제로 삭제된다. message는 v-for로 순회 중인(반응형) 항목을 그대로 받는다.
async function onDeleteAttachment(message: ChatMessage, attachmentId: string) {
  if (message.role !== 'user' || !retrospectiveId.value) return
  try {
    await retro.deleteAttachment(retrospectiveId.value, attachmentId)
    message.attachments = message.attachments?.filter((a) => a.attachmentId !== attachmentId)
  } catch (err) {
    console.log(err)
    show('이 첨부파일은 삭제할 수 없어요.')
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
let appStateListener: PluginListenerHandle | undefined
let backButtonListener: PluginListenerHandle | undefined

function applyKeyboardHeight(raw: number) {
  // 일부 기기는 물리 px로 주므로 CSS px로 정규화
  const h = raw > window.innerHeight ? raw / window.devicePixelRatio : raw
  keyboardHeight.value = h > 0 ? h : 0
  keyboardOpen.value = keyboardHeight.value > 0
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

onMounted(async () => {
  initialApplication()

  // 대화 영역 안 내용(새 메시지 추가, 타이핑 애니메이션의 글자 변화 등)이 바뀔 때마다 바닥으로 스크롤
  if (scrollEl.value) {
    scrollObserver = new MutationObserver(scrollToBottom)
    scrollObserver.observe(scrollEl.value, { childList: true, subtree: true, characterData: true })
  }

  // 안드로이드 하드웨어/제스처 뒤로가기 — 헤더의 뒤로가기 버튼과 동일하게 확인 모달을 띄운다.
  // 리스너를 등록하면 Capacitor의 기본 동작(뒤로 이동/앱 종료)이 자동으로 실행되지 않고,
  // 여기서 직접 처리해야 한다.
  if (isNative.value) {
    backButtonListener = await App.addListener('backButton', () => {
      onBack()
    })

    // iOS는 리사이즈 모드 none이라 키보드 높이만큼 직접 화면을 줄여야 헤더·말풍선이 위로 밀려나지 않는다
    if (Capacitor.getPlatform() === 'ios') {
      kbShow = await Keyboard.addListener('keyboardWillShow', info => applyKeyboardHeight(info.keyboardHeight))
      kbHide = await Keyboard.addListener('keyboardWillHide', () => { keyboardHeight.value = 0; keyboardOpen.value = false })
    }
    // 키보드가 다 올라온 뒤(레이아웃 축소 완료) 채팅을 맨 아래로 → 마지막 질문이 키보드에 가려지지 않음 (iOS·AOS 공통)
    kbDidShow = await Keyboard.addListener('keyboardDidShow', () => scrollToBottom())
  }
})

onUnmounted(() => {
  clearTypingTimers()
  clearTimeout(pollTimer) // 첨부 분석 폴링 중 화면을 벗어나면 예약된 다음 조회를 멈춘다
  scrollObserver?.disconnect()
  backButtonListener?.remove()
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

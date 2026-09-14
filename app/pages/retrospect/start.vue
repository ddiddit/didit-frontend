<template>
  <div
    class="relative h-full bg-white flex flex-col overflow-hidden"
    :style="keyboardOpen ? { height: `calc(100% - ${keyboardHeight}px)` } : undefined"
  >
    <!-- 헤더 영역 — 오른쪽 '회고 마치기'는 응답 대기 중에만 잠기고, 그 외에는 언제나 누를 수 있다 -->
    <RetroHeader :title="'회고 마치기'" :isBusy="isBusy" :finishDisabled="isFinishBlocked" :onBack="onBack" :onFinish="onFinishClick" />

    <!-- 뒤로가기 모달 — 답변을 하나라도 한 경우에만 뜬다(그 전엔 확인 없이 바로 나감).
         지금 나가면 결과가 생성되지 않음을 알리고, '나가기' 시 대화 종료(finish)까지 함께 처리 -->
    <UiPopup
      :modelValue="isBackModal"
      title="아직 회고 결과 생성이 어려워요"
      :description="'충분한 회고가 이뤄지지 않아\n지금 나가면 결과가 생성되지 않아요'"
      cancelText="계속하기"
      confirmText="나가기"
      :loading="isBackLeaving"
      :onConfirm="onBackConfirm"
      :onCancel="onBackCancel"
    />

    <!-- 내용 부족 모달 — 결과 생성 기준을 아직 못 채운 상태에서 회고 마치기를 누른 경우 -->
    <UiPopup
      v-model="isNotReadyModal"
      title="아직 내용이 충분하지 않아요"
      :description="'회고 결과 생성을 위해\n내용을 더 작성해주세요'"
      :showCancel="false"
      confirmText="확인"
      variant="dark"
      @confirm="isNotReadyModal = false"
    />

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
            <div class="didit_message_box mt-[10px] px-[12px] max-w-[250px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] self-start">
              {{ m.typedMain }}
            </div>
            <Transition name="sub-bubble">
              <div v-if="m.showSub" class="didit_sub_message_box mt-[10px] max-w-[250px] px-[12px] py-[14px] bg-grey-3 inline-block text-[14px] rounded-[24px] whitespace-pre-line self-start">
                {{ m.sub }}
              </div>
            </Transition>
          </div>
        </div>
        <div class="didit_message_wrapper self-start" v-else-if="m.role === 'generating'">
          <div class="didit_profile flex flex-col">
            <img src="/icons/icon_chat_didit.png" alt="디딧" class="w-6 h-6" />
            <div class="didit_message_box max-w-[350px] mt-[10px] px-[12px] py-[14px] bg-grey-3 inline-flex items-center gap-[6px] text-[14px] rounded-[24px] self-start text-grey-7">
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
    <RetroTextarea @send="onSend" @accessMic="accessMic" />
  </div>
</template>

<script setup lang="ts">
import type { PluginListenerHandle } from '@capacitor/core'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'
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
      id: string
      role: 'didit'
      main: string
      sub?: string
      skippable?: boolean
      typedMain: string // 타이핑으로 점차 노출되는 본문
      showSub: boolean // 본문 타이핑 완료 후 가이드/스킵 노출
    }
  | { id: string; role: 'generating'; text?: string }
  | { id: string; role: 'user'; text: string }

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
const isBackLeaving = ref(false) // '나가기' 처리 중(finish 호출) — 버튼 잠금
const isBusy = ref(false) // API 호출 중(질문 전환/완료) — 입력·전송 잠금
const questionNo = ref(0) // 화면에 표시한 질문 순번
const isAccessMicModal = ref(false) // 마이크 접근 모달 여부
const micRequesting = ref(false) // 권한 요청 진행 중 — '허용' 버튼 잠금
const isRecorderOpen = ref(false) // 음성 레코더 표시 여부
// 음성 레코더가 변환한 텍스트를 입력창(RetroTextarea)으로 넘기는 초안 채널
const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')

// 회고 마치기(대화 종료) 관련 상태
const isFinishing = ref(false) // finish() 호출 중 — 버튼 잠금
const isNotReadyModal = ref(false) // 내용 부족 안내 모달 표시 여부
// result.vue와 공유하는 채널 — 결과 생성 화면에 어떤 회고를 넘길지 전달
const completingId = useState<string>('retrospect:completing-id')

// AI가 답변에 응답 중인지 — generating 자리표시자가 떠 있으면 응답 대기 중
const isAiResponding = computed(() => messages.value.some(m => m.role === 'generating'))

// 회고 마치기 버튼 잠금 — 초기 로딩·AI 응답 대기·finish 처리 중일 때만 막고, 그 외엔 언제나 누를 수 있다
const isFinishBlocked = computed(() => isBusy.value || isAiResponding.value || isFinishing.value)

// 앰플리튜드 분석용 — 회고 시작 시각/심화질문 노출·스킵 여부 추적
const startedAt = ref(0)
const { profile, load: loadProfile } = useProfile()
const nickname = computed(() => profile.value?.nickname ?? '')

const scrollEl = ref<HTMLElement | null>(null)



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

function applyKeyboardHeight(raw: number) {
  // 일부 기기는 물리 px로 주므로 CSS px로 정규화
  const h = raw > window.innerHeight ? raw / window.devicePixelRatio : raw
  keyboardHeight.value = h > 0 ? h : 0
  keyboardOpen.value = keyboardHeight.value > 0
}

// 첫 마운트 시 불러올 회고 시작
async function startRetro() {
  try {
    const response = await retro.start()
    retrospectiveId.value = response.retrospectiveId
    // reactive()로 감싸지 않으면 typedText에서 typedMain을 mutate해도 화면이 갱신되지 않는다
    const message = reactive({
      id: response.retrospectiveId,
      role: 'didit' as const,
      main: response.initialMessage.body,
      sub: response.initialMessage.title,
      skippable: false,
      typedMain: '',
      showSub: false
    })
    messages.value = [message]
    typedText(message)
  } catch {
    console.error('에러')
  }
}

// 타이핑 애니메이션 — didit 메시지의 main을 한 글자씩 typedMain에 채워나간다
function typedText(message: ChatMessage) {
  if (message.role !== 'didit') return

  let tempText = ''
  let i = 0
  const timer = setInterval(() => {
    tempText += message.main[i] ?? ''
    message.typedMain = tempText
    i += 1
    if (i >= message.main.length) {
      clearInterval(timer)
      // 본문 타이핑이 끝난 뒤 0.4초 있다가 가이드/서브 문구 노출
      if (message.sub) {
        setTimeout(() => {
          message.showSub = true
        }, 400)
      }
    }
  }, 50)
}

// 답변 제출 — 사용자 채팅을 먼저 보여준 뒤, 로딩 자리표시자를 띄우고 AI 응답으로 교체한다
async function onSend(content: string) {
  if (!retrospectiveId.value) return

  messages.value.push({ id: crypto.randomUUID(), role: 'user', text: content })

  // AI 응답을 기다리는 동안 보여줄 자리표시자 — id를 기억해뒀다가 응답 도착 시 이 자리를 교체한다
  const generatingId = crypto.randomUUID()
  messages.value.push({ id: generatingId, role: 'generating' })

  try {
    const response = await retro.answer(retrospectiveId.value, content)
    const idx = messages.value.findIndex(m => m.id === generatingId)
    if (idx === -1) return

    if (!response.assistantMessage) {
      // 다음 질문 없이 완료 준비 신호만 온 경우 — 완료 플로우는 별도 처리 필요
      messages.value.splice(idx, 1)
      return
    }

    const message = reactive({
      id: response.assistantMessage.id,
      role: 'didit' as const,
      main: response.assistantMessage.content ?? response.assistantMessage.title ?? '',
      sub: response.assistantMessage.body ?? undefined,
      skippable: response.readyToComplete,
      typedMain: '',
      showSub: false
    })
    messages.value.splice(idx, 1, message)
    typedText(message)
  } catch {
    // 실패 시 자리표시자 제거하고 안내
    const idx = messages.value.findIndex(m => m.id === generatingId)
    if (idx !== -1) messages.value.splice(idx, 1)
    show('답변을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
  }
}

// 뒤로가기 — 아직 답변을 하나도 안 한 상태(단순 이탈)면 확인 없이 바로 나가고(exit),
// 답변을 한 번이라도 한 상태(진행 중인 회고를 끝내는 것)면 회고 종료 확인 모달을 띄운다.
function onBack() {
  if (isBusy.value) return
  const hasAnswered = messages.value.some(m => m.role === 'user')
  if (!hasAnswered) {
    exitWithoutFinish()
    return
  }
  isBackModal.value = true
}

// 잃을 내용이 없는 단순 이탈 — 확인 모달 없이 바로 나간다.
// V1 exit(): PENDING 상태면 삭제, 그 외엔 유지 (베스트에포트, 실패해도 나가는 것 자체는 막지 않음)
async function exitWithoutFinish() {
  if (retrospectiveId.value) {
    try {
      await retro.exit(retrospectiveId.value)
      localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY)
    } catch {
      // 나가기 실패해도 화면을 나가는 것 자체는 막지 않음
    }
  }
  navigateTo('/home')
}

// 뒤로가기 확인('나가기') — 답변이 있으니 v2 대화 종료(finish)로 정식으로 끝내고 홈으로.
// (다음 진입 시 대화 조회에서 여전히 ACTIVE로 보이면 자연스럽게 이어서 진행됨)
async function onBackConfirm() {
  if (isBackLeaving.value) return // 연타로 finish가 중복 호출되는 것 방지
  isBackLeaving.value = true
  if (retrospectiveId.value) {
    try {
      await retro.finish(retrospectiveId.value)
      localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY) // 대화가 끝났으니 재개 대상에서 제외
    } catch {
      // 종료 실패 — localStorage는 그대로 둬서 다음 진입 시 다시 시도되게 한다
    }
  }
  navigateTo('/home')
}

// 뒤로가기 취소
function onBackCancel() {
  isBackModal.value = false
}

// 회고 마치기 — 대화만 종료(finish)하고, 곧바로 결과 생성 화면으로 넘긴다.
// (result.vue가 completingId로 complete() API를 호출해 AI 제목/요약을 자동으로 정리한다)
async function onFinishClick() {
  if (isFinishBlocked.value || !retrospectiveId.value) return
  isFinishing.value = true
  try {
    // 로컬 skippable 신호가 늦게 갱신되는 경우가 있어, 대화 조회로 서버의 readyToComplete를 직접 확인
    const conversation = await retro.getConversation(retrospectiveId.value)
    if (!conversation.readyToComplete) {
      isNotReadyModal.value = true
      isFinishing.value = false // 계속 회고를 이어갈 수 있게 잠금 해제
      return
    }

    await retro.finish(retrospectiveId.value)
    localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY) // 대화가 끝났으니 재개 대상에서 제외
    completingId.value = retrospectiveId.value
    navigateTo('/retrospect/result')
    // 성공 시엔 isFinishing을 풀지 않는다 — 결과 화면으로 넘어가는 동안 버튼이 다시 눌리는 것 방지
  } catch {
    isFinishing.value = false // 실패 — 다시 시도할 수 있게 잠금 해제
    show('회고를 마치지 못했어요. 잠시 후 다시 시도해주세요.')
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

// 첫 마운트 시 로직
onMounted(() => {
  startRetro()
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

<template>
  <div
    class="relative h-full bg-white flex flex-col overflow-hidden"
    :style="keyboardOpen ? { height: `calc(100% - ${keyboardHeight}px)` } : undefined"
  >
    <!-- 헤더 영역 — 오른쪽 '회고 마치기'는 응답 대기 중·마치기 처리 중에만 잠기고, 그 외에는 언제나 누를 수 있다 -->
    <RetroHeader :title="'회고 마치기'" :isBusy="isBusy" :finishDisabled="isBusy || isFinishing" :onBack="onBack" :onFinish="onFinishClick" />

    <!-- 마이크 접근 모달 — 권한이 아직 없을 때만. 이미 허용된 경우 accessMic()에서 바로 레코더를 연다 -->
    <UiPopup :modelValue="isAccessMicModal" :title="'디딧(didit)이(가) 마이크에 접근하려고 합니다.'" :description="'회고를 음성으로 기록하기 위해 마이크 접근 권한이 필요해요.'" :confirmText="'허용'" :cancelText="'허용 안 함'" :loading="micRequesting" @cancel="isAccessMicModal = false" @confirm="confirmAccessMic" />

    <!-- 뒤로가기 확인 모달 — 답변은 저장되어 나중에 이어할 수 있으니, 실수로 나가는 것만 막는 가벼운 확인 -->
    <UiPopup :modelValue="isBackModal" :title="'회고를 그만하시겠어요?'" :description="'지금 나가도 답변은 저장돼요. 다음에 이어서 할 수 있어요.'" :confirmText="'나가기'" :cancelText="'계속하기'" @cancel="onBackCancel" @confirm="onBackConfirm" />

    <!-- 회고 마치기 확인 모달 — 실수로 대화를 끝내지 않도록 확인 후 결과를 생성한다 -->
    <UiPopup :modelValue="isFinishModal" :title="'회고를 마칠까요?'" :description="'지금까지의 답변으로 회고 결과를 만들어요.'" :confirmText="'마치기'" :cancelText="'계속하기'" :loading="isFinishing" @cancel="onFinishCancel" @confirm="onFinishConfirm" />

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
              <!-- 텍스트 없는 자리표시자(답변 후 다음 질문 대기 등)는 로티만, 텍스트가 있으면(결과 정리 등) 함께 노출 -->
              <DotLottieVue v-if="!m.text" class="w-5 h-5 shrink-0" autoplay loop :src="GENERATING_LOTTIE" />
              <span v-else>{{ m.text }}</span>
            </div>
          </div>
        </div>
        <RetroUserMessage v-else-if="m.role === 'user'" :text="m.text" />
      </div>
    </div>

    <!-- 입력 영역 -->
    <RetroTextarea :disabled="isBusy" @send="onSend" @accessMic="accessMic" />
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
import { isServerError } from '~/utils/api-error'
import type { RetrospectiveResultStash } from '~/types/api'

definePageMeta({ middleware: ['auth', 'no-direct-entry'], layout: false })

// generating 자리표시자(다음 질문 대기 중)에서 재생할 로티 — public/icons/loading.lottie
const GENERATING_LOTTIE = '/icons/loading.lottie'

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
const isBusy = ref(false) // API 호출 중(질문 전환/완료)·AI 메시지 타이핑 중 — 입력·전송·헤더 버튼 잠금

const isAccessMicModal = ref(false) // 마이크 접근 모달 여부
const isBackModal = ref(false) // 뒤로가기 확인 모달 여부
const isFinishModal = ref(false) // 회고 마치기 확인 모달 여부
const isFinishing = ref(false) // finish() 처리 중 — 결과 화면으로 넘어가는 라우팅 전환까지는 풀지 않는다
const micRequesting = ref(false) // 권한 요청 진행 중 — '허용' 버튼 잠금
const isRecorderOpen = ref(false) // 음성 레코더 표시 여부
// 음성 레코더가 변환한 텍스트를 입력창(RetroTextarea)으로 넘기는 초안 채널
const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')

// 회고 마치기 성공 시 result.vue로 넘길 값 — completingId로 대상 회고를, resultStash로 finish() 결과를 전달한다
const completingId = useState<string>('retrospect:completing-id')
const resultStash = useState<RetrospectiveResultStash | null>('retrospect:result', () => null)


// 앰플리튜드 분석용 — 회고 시작 시각/심화질문 노출·스킵 여부 추적
const startedAt = ref(0)
const { profile, load: loadProfile } = useProfile()
const nickname = computed(() => profile.value?.nickname ?? '')

// 타이핑 애니메이션 공용 로직 (buildDiditMessage: AI 메시지 → 채팅 말풍선 변환 / typeDiditMessage: 한 글자씩 타이핑)
const { typeDiditMessage, clearTypingTimers } = useDiditTyping()

// 진행 중이던 회고 이어가기 — 대화 조회(getConversation)로 상태를 복구해 이어서 진행할 수 있으면 true.
// AI 메시지만 내려오고 사용자 답변 텍스트는 포함되지 않아, 전체 대화 재구성은 불가능하고
// '가장 마지막 질문' 복구만 가능하다.
async function resumeActiveRetrospective(id: string): Promise<boolean> {
  try {
    const conversation = await retro.getConversation(id)
    if (conversation.conversationStatus !== 'ACTIVE') return false

    const lastMessage = conversation.messages.at(-1)
    if (!lastMessage) return false

    retrospectiveId.value = id
    const diditMessage = buildDiditMessage(lastMessage, conversation.readyToComplete)
    // 이미 노출됐던 메시지 — 재진입 시에는 타이핑 애니메이션 없이 바로 전체 노출 (sub이 없으면 노출 안 함)
    diditMessage.typedMain = diditMessage.main
    diditMessage.showSub = !!diditMessage.sub
    messages.value = [diditMessage]
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

// 처음 start.vue 페이지에 접근 시 실행할 함수 — 저장된 진행 중 회고 id가 있으면 새로 만들지 않고 이어서 진행
async function initialApplication() {
  try {
    const savedId = localStorage.getItem(ACTIVE_RETROSPECTIVE_KEY)
    if (savedId) {
      if (await resumeActiveRetrospective(savedId)) return
      localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY) // 유효하지 않은 id — 정리 후 새로 시작
    }

    const first_response = await retro.start()
    if (first_response.conversationStatus !== 'ACTIVE') return;
    retrospectiveId.value = first_response.retrospectiveId
    localStorage.setItem(ACTIVE_RETROSPECTIVE_KEY, first_response.retrospectiveId)
    const diditMessage = buildDiditMessage(first_response.initialMessage)
    messages.value = [diditMessage]
    isBusy.value = true
    typeDiditMessage(diditMessage, 50, () => { isBusy.value = false })
  } catch(err) {
    console.log(err)
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
  }
}

// 헤더 뒤로가기 — 실수로 나가서 회고를 잃지 않도록 바로 이동하지 않고 확인 모달을 띄운다.
function onBack() {
  if (isBusy.value) return
  isBackModal.value = true
}

// 뒤로가기 확인('나가기') — 회고 나가기(exit) API는 호출하지 않는다. 진행 중인 회고는
// ACTIVE_RETROSPECTIVE_KEY로 남아있어 다음 진입 시 대화 조회로 이어서 진행할 수 있다.
function onBackConfirm() {
  isBackModal.value = false
  navigateTo('/home')
}

// 뒤로가기 취소 — 모달만 닫고 계속 진행
function onBackCancel() {
  isBackModal.value = false
}

// 헤더 '회고 마치기' — 바로 종료하지 않고 확인 모달을 띄운다.
function onFinishClick() {
  if (isBusy.value || isFinishing.value || !retrospectiveId.value) return
  isFinishModal.value = true
}

// 회고 마치기 확인 — 대화를 종료(finish)한다. v2는 종료와 동시에 확인된 대화 내용을 구조화해
// 결과를 생성하므로, 응답의 title/result를 그대로 결과 화면(result.vue)에 넘긴다.
async function onFinishConfirm() {
  if (isFinishing.value || !retrospectiveId.value) return
  isFinishing.value = true
  try {
    const res = await retro.finish(retrospectiveId.value)
    if (!res.result || !res.title) {
      show('회고 결과를 생성하지 못했어요. 잠시 후 다시 시도해주세요.')
      isFinishing.value = false
      return
    }
    resultStash.value = { title: res.title, result: res.result }
    completingId.value = retrospectiveId.value
    localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY) // 대화가 끝났으니 재개 대상에서 제외
    navigateTo('/retrospect/result')
    // 결과 화면으로 넘어가는 라우팅 전환 중 확인 버튼이 다시 눌려 finish가 중복 호출되는 것을
    // 막기 위해 성공 케이스에서는 isFinishing을 여기서 풀지 않는다.
  } catch (err) {
    isFinishing.value = false
    console.log(err)
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    else show('회고를 마치지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isFinishModal.value = false
  }
}

// 회고 마치기 취소 — 모달만 닫고 계속 진행
function onFinishCancel() {
  isFinishModal.value = false
}

// 답변 제출 — 사용자 메시지를 먼저 반영하고, AI 응답을 기다리는 동안 generating 자리표시자를 보여준 뒤
// 도착하면 didit 메시지로 교체해 타이핑 애니메이션을 시작한다 (배열은 매번 새로 만들어 불변성 유지)
async function onSend(content: string) {
  if (!retrospectiveId.value || isBusy.value) return

  const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: content }
  messages.value = [...messages.value, userMessage]

  const generatingId = crypto.randomUUID()
  messages.value = [...messages.value, { id: generatingId, role: 'generating' }]

  isBusy.value = true
  try {
    const response = await retro.answer(retrospectiveId.value, content)

    if (!response.assistantMessage) {
      // 아직 AI 응답이 준비되지 않은 경우 — generating 자리표시자만 지운다
      messages.value = messages.value.filter((m) => m.id !== generatingId)
      isBusy.value = false
      return
    }

    const diditMessage = buildDiditMessage(response.assistantMessage, response.readyToComplete)
    messages.value = messages.value.map((m) => (m.id === generatingId ? diditMessage : m))
    typeDiditMessage(diditMessage, 50, () => { isBusy.value = false })
  } catch (err) {
    messages.value = messages.value.filter((m) => m.id !== generatingId)
    isBusy.value = false
    console.log(err)
    if (isServerError(err)) show('알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    else show('답변을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
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

onMounted(() => {
  initialApplication()
})

onUnmounted(() => {
  clearTypingTimers()
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

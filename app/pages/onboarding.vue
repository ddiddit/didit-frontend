<template>
  <div class="h-full bg-white flex flex-col">

    <!-- ── 백 버튼: H:50, Y:54(상태바 높이), 좌측 패딩 20 ── -->
    <div
      class="flex items-center shrink-0 h-[50px] px-5"
      style="margin-top: max(54px, env(safe-area-inset-top, 54px));"
    >
      <button class="p-1 -ml-1" @click="handleBack">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
    </div>

    <!-- ── 프로그레스 바: H:4, gap:4, rounded-full, grey-4/Primary ── -->
    <div class="flex gap-1 px-5 shrink-0">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-1 h-[4px] rounded-full bg-grey-4 overflow-hidden"
      >
        <div
          class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          :class="i <= step ? 'w-full' : 'w-0'"
        />
      </div>
    </div>

    <!-- ── 제목: Y:136 = 상태바54 + 백버튼50 + 프로그레스4 + 간격28 ── -->
    <div class="px-5 shrink-0" style="padding-top:28px;">
      <h1 class="font-bold text-grey-13 whitespace-pre-line" style="font-size:22px;line-height:1.4;">{{ stepTitle }}</h1>
      <p v-if="stepSubtitle" class="text-body3 font-normal text-grey-7 mt-2">{{ stepSubtitle }}</p>
    </div>

    <!-- ── STEP 1: 약관 동의 ── -->
    <template v-if="step === 1">
      <!-- 중간 여백 -->
      <div class="flex-1" />

      <!-- 약관 섹션 -->
      <div class="px-5 shrink-0">
        <!-- 전체 동의: Figma H:56, gap:8, radius:12, px:16, 좌측정렬 -->
        <UiButton variant="secondary" justify="start" :active="allAgreed" @click="toggleAll">
          <span class="w-6 h-6 flex items-center justify-center shrink-0">
            <img
              :src="allAgreed ? '/icons/check-on.svg' : '/icons/check-off.svg'"
              alt="전체 동의"
              class="w-4 h-4"
            />
          </span>
          <span class="font-semibold text-[17px] leading-[1.4] tracking-[-0.02em] text-grey-13">전체 동의</span>
        </UiButton>

        <!-- 전체동의 ↔ 개별항목: 20px 간격 -->
        <!-- 개별항목 사이: 8px 간격 -->
        <div class="mt-5 px-1 flex flex-col gap-2">
          <div
            v-for="term in terms"
            :key="term.key"
            class="flex items-center"
          >
            <button class="flex items-center gap-2 flex-1" @click="toggleTerm(term.key)">
              <span class="w-6 h-6 flex items-center justify-center shrink-0">
                <img
                  :src="agreements[term.key] ? '/icons/check-on.svg' : '/icons/check-off.svg'"
                  :alt="term.label"
                  class="w-4 h-4"
                />
              </span>
              <span
                class="text-label1 font-medium text-left"
                :class="agreements[term.key] ? 'text-grey-13' : 'text-grey-8'"
              >{{ term.label }}</span>
            </button>
            <button class="w-5 h-5 shrink-0" @click="openTermModal(term.key)">
              <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── STEP 2: 프로필 설정 ── -->
    <template v-else-if="step === 2">
      <div class="flex-1 px-5 overflow-y-auto scrollbar-hide flex flex-col gap-7 pt-7">
        <!-- 닉네임 -->
        <UiTextInput
          v-model="nickname"
          label="닉네임"
          placeholder="어떤 이름으로 불러드릴까요?"
          :maxlength="10"
          hint="한글 또는 영문 2~10자"
          :error="nicknameMessage"
          :success="nicknameStatus === 'available'"
          clearable
          @keydown.enter.prevent="onNicknameEnter"
        />

        <!-- 직무 선택 -->
        <div>
          <label class="text-label1 font-medium text-grey-13 mb-3 block">직무 선택</label>
          <div class="grid grid-cols-3 gap-[10px]">
            <UiButton
              v-for="job in jobs"
              :key="job.value"
              variant="chip"
              size="md"
              :active="selectedJob === job.value"
              :muted="selectedJob !== null && selectedJob !== job.value"
              @click="selectedJob = job.value"
            >{{ job.label }}</UiButton>
          </div>
        </div>
      </div>
    </template>

    <!-- ── STEP 3: 추가 정보 ── -->
    <template v-else-if="step === 3">
      <div class="flex-1 px-5 overflow-y-auto scrollbar-hide flex flex-col gap-7 pt-7">
        <!-- 나이대 -->
        <div>
          <label class="text-label1 font-medium text-grey-13 mb-3 block">나이대</label>
          <div class="grid grid-cols-3 gap-[10px]">
            <UiButton
              v-for="age in ages"
              :key="age.value"
              variant="chip"
              size="md"
              :active="selectedAge === age.value"
              :muted="selectedAge !== null && selectedAge !== age.value"
              @click="selectedAge = age.value"
            >{{ age.label }}</UiButton>
          </div>
        </div>

        <!-- 연차 -->
        <div>
          <label class="text-label1 font-medium text-grey-13 mb-3 block">연차</label>
          <div class="grid grid-cols-3 gap-[10px]">
            <UiButton
              v-for="exp in experiences"
              :key="exp.value"
              variant="chip"
              size="md"
              :active="selectedExperience === exp.value"
              :muted="selectedExperience !== null && selectedExperience !== exp.value"
              @click="selectedExperience = exp.value"
            >{{ exp.label }}</UiButton>
          </div>
        </div>
      </div>
    </template>

    <!-- ── 다음/완료 버튼: 하단 항상 50px ── -->
    <div class="px-5 pt-9 shrink-0" style="padding-bottom: max(50px, env(safe-area-inset-bottom, 50px));">
      <UiButton
        :disabled="!isNextEnabled || isSubmitting"
        :loading="isSubmitting"
        @click="nextStep"
      >
        <span v-if="step < 3">다음</span>
        <span v-else>시작하기</span>
      </UiButton>
    </div>
  </div>

  <!-- ── 약관 상세 모달 ── -->
  <Teleport to="#app-container">
    <div
      v-if="activeTermModal"
      class="absolute inset-0 z-50 flex flex-col"
      style="background: rgba(0,0,0,0.4);"
    >
      <!-- 상단 70px: 클릭 시 닫기 -->
      <div class="shrink-0" style="height:70px;" @click="activeTermModal = null" />
      <!-- 흰 카드: 나머지 공간 전체 -->
      <div
        class="flex-1 bg-white flex flex-col overflow-hidden"
        style="border-radius: 20px 20px 0 0;"
      >
        <!-- X 버튼 -->
        <div class="flex justify-end px-5 pt-6 shrink-0">
          <button
            type="button"
            class="w-6 h-6 shrink-0 outline-none appearance-none bg-transparent border-0 p-0 flex items-center justify-center"
            @click="activeTermModal = null"
          >
            <img src="/icons/close.svg" alt="닫기" class="w-6 h-6 block" />
          </button>
        </div>
        <!-- 제목: X와 10px 간격, SemiBold 20px/140%/-2% -->
        <div class="px-5 shrink-0" style="padding-top:10px; padding-bottom:24px;">
          <h2 class="text-heading1 font-semibold text-grey-13">{{ activeTermTitle }}</h2>
        </div>
        <!-- 본문: 섹션(제N조) 기준, 섹션 간 24px / 소제목↔본문·본문↔본문 8px -->
        <div class="flex-1 overflow-y-auto scrollbar-hide px-5">
          <div class="pb-6">
            <div
              v-for="(section, i) in termSections"
              :key="i"
              :style="i > 0 ? 'margin-top:24px;' : ''"
            >
              <p
                v-if="section.heading"
                class="font-bold text-grey-13"
                style="font-size:14px;line-height:1.4;letter-spacing:-0.02em;margin-bottom:8px;"
              >{{ section.heading }}</p>
              <template v-for="(para, j) in section.body" :key="j">
                <!-- 줄바꿈 포함된 단락은 한 줄씩 분리 출력 -->
                <p
                  v-for="(line, k) in para.split('\n').map(l => l.trim()).filter(Boolean)"
                  :key="k"
                  class="font-normal"
                  style="font-size:14px;line-height:1.6;letter-spacing:-0.02em;color:#3C3C3C;"
                >{{ line }}</p>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { ApiResponse, JobType, AgeType, ExperienceType, NicknameCheckResponse } from '~/types/api'

definePageMeta({ layout: false })

const { $api } = useNuxtApp()

// ── 상태 ──────────────────────────────────────────────────────────
const step = ref(1)
const isSubmitting = ref(false)

const stepTitle = computed(() => {
  if (step.value === 1) return '서비스 이용을 위해\n약관에 동의해 주세요'
  if (step.value === 2) return '프로필 설정'
  return '추가 정보 입력'
})

const stepSubtitle = computed(() => {
  if (step.value === 3) return '아래 정보를 입력하고 나에게 맞는 회고를 시작해 보세요'
  return ''
})

// STEP 1
const agreements = reactive({
  service: false,
  privacy: false,
  marketing: false,
  nightPush: false,
})

const terms = [
  { key: 'service' as const, label: '[필수] 서비스 이용약관 동의' },
  { key: 'privacy' as const, label: '[필수] 개인정보 수집 및 이용 동의' },
  { key: 'marketing' as const, label: '[선택] 마케팅 정보 수신 동의' },
  { key: 'nightPush' as const, label: '[선택] 야간(오후 9시~오전 8시) 푸시 수신 동의' },
]

const allAgreed = computed(() => Object.values(agreements).every(Boolean))

function toggleAll() {
  const next = !allAgreed.value
  Object.keys(agreements).forEach((k) => (agreements[k as keyof typeof agreements] = next))
}

function toggleTerm(key: keyof typeof agreements) {
  agreements[key] = !agreements[key]
}

// STEP 2
const nickname = ref('')
const nicknameStatus = ref<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid'>('idle')
const nicknameMessage = ref('')
const selectedJob = ref<JobType | null>(null)

const jobs = [
  { value: 'PLANNER' as JobType, label: '기획' },
  { value: 'DEVELOPER' as JobType, label: '개발' },
  { value: 'DESIGNER' as JobType, label: '디자인' },
]

// 0.2초 디바운스로 중복 체크 호출
const debouncedCheckNickname = useDebounceFn(async () => {
  const value = nickname.value.trim()
  if (value.length < 2 || /[^가-힣a-zA-Z]/.test(value)) return
  await checkNickname()
}, 200)

// 실시간 형식 검사 + 디바운스 중복 체크
watch(nickname, (value) => {
  nicknameMessage.value = ''
  if (value.length === 0) {
    nicknameStatus.value = 'idle'
    return
  }
  if (/[^가-힣a-zA-Z]/.test(value)) {
    nicknameStatus.value = 'invalid'
    nicknameMessage.value = '공백, 숫자, 특수문자는 사용할 수 없어요'
    return
  }
  nicknameStatus.value = 'idle'
  if (value.length >= 2) {
    debouncedCheckNickname()
  }
})

// 엔터키로 즉시 중복 체크
async function onNicknameEnter() {
  const value = nickname.value.trim()
  if (value.length < 2 || /[^가-힣a-zA-Z]/.test(value)) return
  if (nicknameStatus.value === 'checking' || nicknameStatus.value === 'available') return
  await checkNickname()
}

async function checkNickname() {
  const value = nickname.value.trim()
  nicknameStatus.value = 'checking'
  try {
    const res = await $api.get<ApiResponse<NicknameCheckResponse>>(
      `/api/v1/users/nickname/check?nickname=${encodeURIComponent(value)}`,
    )
    if (res.data.data.isDuplicate) {
      nicknameStatus.value = 'duplicate'
      nicknameMessage.value = '이미 사용 중인 닉네임이에요'
    } else {
      nicknameStatus.value = 'available'
      nicknameMessage.value = ''
    }
  } catch {
    nicknameStatus.value = 'idle'
    nicknameMessage.value = '확인 중 오류가 발생했어요'
  }
}

// STEP 3
const selectedAge = ref<AgeType | null>(null)
const selectedExperience = ref<ExperienceType | null>(null)

const ages = [
  { value: 'AGE_20' as AgeType, label: '20대' },
  { value: 'AGE_30' as AgeType, label: '30대' },
  { value: 'AGE_40_PLUS' as AgeType, label: '40대 이상' },
]

const experiences = [
  { value: 'LESS_THAN_1_YEAR' as ExperienceType, label: '1년 미만' },
  { value: 'YEARS_1_TO_2' as ExperienceType, label: '1~2년' },
  { value: 'YEARS_3_TO_5' as ExperienceType, label: '3~5년' },
  { value: 'YEARS_6_TO_9' as ExperienceType, label: '6~9년' },
  { value: 'YEARS_10_PLUS' as ExperienceType, label: '10년 이상' },
]

// ── 네비게이션 ────────────────────────────────────────────────────
const isNextEnabled = computed(() => {
  if (step.value === 1) return agreements.service && agreements.privacy
  if (step.value === 2) return nicknameStatus.value === 'available' && selectedJob.value !== null
  return selectedAge.value !== null && selectedExperience.value !== null
})

function handleBack() {
  if (step.value === 1) {
    // 온보딩 포기 = 로그아웃 처리 후 로그인 화면으로
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('isOnboardingCompleted')
    navigateTo('/auth/login', { replace: true })
  } else {
    step.value--
  }
}

function prevStep() {
  if (step.value > 1) step.value--
}

async function nextStep() {
  if (!isNextEnabled.value) return
  if (step.value < 3) { step.value++; return }
  await submitOnboarding()
}

// ── 약관 모달 ─────────────────────────────────────────────────────
const activeTermModal = ref<keyof typeof agreements | null>(null)

// 약관 전문의 첫 줄이 제목 — 모달 헤더에 표시하고 본문에서 제거
const activeTermRaw = computed(() => {
  if (activeTermModal.value === 'service') return SERVICE_TERMS
  if (activeTermModal.value === 'privacy') return PRIVACY_TERMS
  if (activeTermModal.value === 'marketing') return MARKETING_TERMS
  if (activeTermModal.value === 'nightPush') return NIGHT_PUSH_TERMS
  return ''
})
const activeTermTitle = computed(() => activeTermRaw.value.split('\n')[0].trim())
const activeTermContent = computed(() => activeTermRaw.value.split('\n').slice(1).join('\n').trimStart())

// 제N조 기준으로 섹션 분리 — 섹션 간 24px, 소제목↔본문 8px, 본문↔본문 8px
const termSections = computed(() => {
  const sections: { heading: string; body: string[] }[] = []
  let current: { heading: string; body: string[] } | null = null

  activeTermContent.value
    .split(/\n\n+/)
    .map(b => b.trim())
    .filter(Boolean)
    .forEach(block => {
      const lines = block.split('\n')
      const firstLine = lines[0].trim()
      if (/^제\d+조/.test(firstLine) || /^\d+\.\s/.test(firstLine)) {
        if (current) sections.push(current)
        current = { heading: firstLine, body: [] }
        const rest = lines.slice(1).join('\n').trim()
        if (rest) current.body.push(rest)
      } else {
        if (!current) current = { heading: '', body: [] }
        current.body.push(block)
      }
    })

  if (current) sections.push(current)
  return sections
})

function openTermModal(key: keyof typeof agreements) {
  activeTermModal.value = key
}


// ── 온보딩 제출 ───────────────────────────────────────────────────
async function submitOnboarding() {
  if (!selectedJob.value || !selectedAge.value || !selectedExperience.value) return
  isSubmitting.value = true
  try {
    await $api.post('/api/v2/users/onboarding', {
      nickname: nickname.value.trim(),
      job: selectedJob.value,
      age: selectedAge.value,
      experience: selectedExperience.value,
      marketingAgreed: agreements.marketing,
      nightPushAgreed: agreements.nightPush,
    })
    localStorage.setItem('isOnboardingCompleted', 'true')
    navigateTo('/home', { replace: true })
  } catch {
    alert('온보딩 처리 중 오류가 발생했어요. 다시 시도해주세요.')
  } finally {
    isSubmitting.value = false
  }
}

// ── 약관 전문 ─────────────────────────────────────────────────────
const SERVICE_TERMS = `디딧(didit) 서비스 이용약관

제1조 (목적)
본 약관은 디딧(didit) 서비스(이하 "서비스")를 제공하는 회사(이하 "회사")와 서비스를 이용하는 회원(이하 "이용자") 간의 권리, 의무 및 책임 사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.

"서비스"란 회사가 제공하는 AI 기반 회고 기능 및 이에 부수되는 기능, 웹사이트, 모바일 애플리케이션 등 디딧이 제공하는 모든 서비스를 의미합니다.

"이용자"란 본 약관에 동의하고 Apple, Google 등 소셜 로그인 계정을 통해 서비스에 가입하여 서비스를 이용하는 자를 말합니다.

"콘텐츠"란 이용자가 서비스를 이용하면서 작성, 기록 또는 저장하는 텍스트, 회고 내용, 정보 및 기타 데이터를 의미합니다.

"AI 기능"이란 이용자가 입력한 정보에 기반하여 회사가 제공하는 자동 피드백, 추천, 분석 등 인공지능 기반 기능을 의미합니다.

제3조 (약관의 게시 및 변경)
본 약관은 서비스 내 화면 또는 회사가 제공하는 방법을 통해 게시되며, 이용자가 약관에 동의함으로써 효력이 발생합니다.

회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.

약관이 변경될 경우 회사는 변경 내용 및 적용일자를 사전에 공지합니다.

이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.

제4조 (회원가입 및 계정 관리)
서비스 이용은 Apple, Google 등 소셜 로그인 방식을 통해 회원가입을 완료한 후 가능합니다.

이용자는 정확하고 최신의 정보를 제공해야 하며, 허위 정보 제공으로 발생하는 불이익에 대한 책임은 이용자에게 있습니다.

이용자는 본인의 계정 정보를 안전하게 관리해야 하며 타인에게 양도, 대여 또는 공유할 수 없습니다.

계정 관리 소홀로 인해 발생한 문제에 대해 회사는 책임을 지지 않습니다.

제5조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다.

• AI 기반 회고 질문 제공
• 회고 기록 작성 및 저장 기능
• AI 기반 회고 분석 및 피드백 제공
• 회고 기록 관리 및 조회 기능
• 기타 회사가 정하는 서비스

회사는 서비스 품질 향상을 위해 서비스의 기능을 추가, 변경 또는 삭제할 수 있습니다.

제6조 (서비스 이용 제한)
회사는 다음과 같은 경우 이용자의 서비스 이용을 제한하거나 계정을 정지할 수 있습니다.

• 타인의 정보를 도용하여 계정을 생성한 경우
• 불법적인 콘텐츠를 게시하거나 유포한 경우
• 타인 또는 특정 대상에 대한 명예훼손, 비방, 욕설 등 부적절한 행위를 한 경우
• 서비스 시스템을 해킹하거나 비정상적인 접근을 시도한 경우
• 서비스 운영을 고의적으로 방해하는 경우
• 기타 관련 법령 또는 본 약관을 위반한 경우

제7조 (회원의 의무)
이용자는 다음 사항을 준수해야 합니다.

• 관련 법령, 본 약관 및 회사의 공지사항을 준수해야 합니다.
• 허위 정보 또는 타인을 오도하는 정보를 게시해서는 안 됩니다.
• 상업적 홍보 또는 광고 목적의 콘텐츠를 무단으로 등록할 수 없습니다.
• 다른 이용자의 개인정보를 무단으로 수집·저장·공개해서는 안 됩니다.

제8조 (콘텐츠의 저작권 및 이용권)
이용자가 서비스 내에 작성한 콘텐츠의 저작권은 해당 이용자에게 있습니다.

이용자는 회사가 다음 목적을 위해 콘텐츠를 사용할 수 있음에 동의합니다.

• 서비스 운영 및 기능 제공
• 서비스 개선 및 사용자 경험 향상
• 서비스 홍보 및 마케팅 목적 활용
• 검색 및 추천 기능 구현

회사는 이용자의 동의 없이 콘텐츠를 제3자에게 판매하지 않습니다.

제9조 (AI 기능 이용)
회사는 서비스 내에서 AI 기반 분석, 피드백 또는 추천 기능을 제공할 수 있습니다.

AI 기능은 참고용 정보이며 회사는 해당 결과의 정확성, 완전성 또는 특정 목적 적합성을 보장하지 않습니다.

이용자는 AI 기능을 이용함에 있어 제공되는 결과를 개인의 판단과 책임 하에 활용해야 합니다.

제10조 (알림 서비스)
회사는 서비스 운영, 업데이트, 공지사항 안내 등을 위해 푸시 알림을 제공할 수 있습니다.

이용자는 서비스 설정 메뉴를 통해 알림 수신 여부를 변경할 수 있습니다.

마케팅 정보 또는 광고성 알림의 경우 이용자의 별도 동의를 받은 경우에만 발송됩니다.

제11조 (개인정보 보호)
회사는 이용자의 개인정보를 관련 법령 및 회사의 개인정보처리방침에 따라 보호합니다.

개인정보 처리에 관한 자세한 사항은 서비스 내에 게시된 개인정보처리방침을 따릅니다.

제12조 (서비스 중단)
회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.

• 시스템 점검 및 유지보수
• 서버 장애 또는 통신 장애
• 천재지변 등 불가항력적 상황

서비스 중단이 발생할 경우 회사는 가능한 범위 내에서 사전에 공지합니다.

제13조 (회원 탈퇴 및 계약 해지)
이용자는 언제든지 서비스 내 회원 탈퇴 기능을 통해 탈퇴할 수 있습니다.

탈퇴 시 이용자의 개인정보는 관련 법령 및 개인정보처리방침에 따라 처리됩니다.

이용자가 작성한 콘텐츠는 서비스 운영 정책에 따라 삭제 또는 비식별 처리될 수 있습니다.

회사는 약관 위반 등 부정 이용이 확인된 경우 사전 통보 후 계정을 해지할 수 있습니다.

제14조 (책임 제한)
회사는 다음 사항에 대해 책임을 지지 않습니다.

• 이용자가 서비스에 게시한 콘텐츠의 정확성
• 이용자 간 발생한 분쟁
• 서비스 장애로 인한 데이터 손실
• 이용자의 위법 행위로 인해 발생한 손해

제15조 (준거법 및 분쟁 해결)
본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.

회사와 이용자 간 분쟁이 발생한 경우 당사자는 성실히 협의하여 해결하도록 노력합니다.

협의로 해결되지 않을 경우 관할 법원은 대한민국 민사소송법에 따릅니다.`

const PRIVACY_TERMS = `디딧(didit) 개인정보처리방침

1. 총칙
디딧(didit) 서비스(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을 준수합니다.

2. 수집하는 개인정보 항목

① 회원가입 및 로그인 시
• 소셜 로그인 고유 식별자(ID)
• 닉네임
• 이메일 주소 (제공 범위 내)
• 프로필 이미지 (제공 범위 내)

② 서비스 이용 과정에서 자동 수집되는 정보
• 기기 정보 (OS, 기기 모델명 등)
• IP 주소, 접속 로그, 서비스 이용 기록

③ 서비스 이용 시 생성되는 정보
• 서비스 내 작성한 텍스트 콘텐츠

3. 개인정보 수집 및 이용 목적
• 회원 식별 및 로그인 인증
• 서비스 기능 제공 및 운영
• 서비스 품질 개선 및 통계 분석
• 부정 이용 방지 및 서비스 보안 유지

4. 개인정보의 보유 및 이용기간
• 회원 정보: 회원 탈퇴 후 30일
• 서비스 이용 기록: 3개월
• 접속 로그 및 IP 정보: 3개월

5. 개인정보 보호책임자
담당자: 이예진
이메일: lyjin4041@gmail.com`

const MARKETING_TERMS = `디딧(didit) 마케팅 정보 수신 동의

본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.

제1조 (목적)
이메일, 앱 푸시 알림, 인앱 알림 등을 통해 서비스 관련 마케팅 정보를 발송하기 위함입니다.

제2조 (수집 및 활용 항목)
• 닉네임
• 이메일 주소
• 서비스 이용 기록 및 데이터

제3조 (마케팅 활용 목적)
• 신규 기능 또는 서비스 출시 안내
• 서비스 관련 이벤트, 프로모션 및 혜택 제공
• 개인 맞춤형 서비스 안내 및 광고 정보 제공

제4조 (동의 거부 시 불이익)
동의를 거부해도 서비스 기본 이용에는 제한이 없습니다.
(단, 이벤트·혜택 등 일부 정보 제공이 제한될 수 있습니다.)

제5조 (동의 철회)
앱 내 설정 메뉴 또는 고객센터를 통해 언제든지 철회할 수 있습니다.`

const NIGHT_PUSH_TERMS = `디딧(didit) 야간 마케팅 정보 수신 동의

본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다.

제1조 (목적)
야간 시간대(오후 9시~오전 8시)에 앱 푸시 알림 등을 통해 광고성 정보 및 마케팅 정보를 발송하기 위함입니다.

제2조 (발송 정보의 종류)
• 서비스 이벤트 및 프로모션 안내
• 신규 기능 또는 서비스 업데이트 안내
• 이용자 맞춤형 콘텐츠 추천
• 회고 작성 리마인더 알림

제3조 (동의 거부 시 불이익)
동의를 거부해도 서비스 이용에는 제한이 없습니다.
단, 야간 시간대 이벤트 및 혜택 안내를 받을 수 없습니다.

제4조 (동의 철회)
앱 내 마이페이지 → 알림 설정에서 야간 알림 수신을 해제할 수 있습니다.`
</script>

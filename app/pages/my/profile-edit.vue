<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">프로필 수정</span>
      <button
        class="text-body2 font-semibold"
        :class="canSave ? 'text-primary' : 'text-grey-6'"
        :disabled="!canSave || isSaving"
        @click="onSave"
      >
        저장
      </button>
    </div>

    <!-- 본문: 온보딩 STEP 2와 동일한 레이아웃 -->
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
            @click="selectedJob = job.value"
          >{{ job.label }}</UiButton>
        </div>
      </div>

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
            @click="selectedExperience = exp.value"
          >{{ exp.label }}</UiButton>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, UserProfile, JobType, AgeType, ExperienceType, NicknameCheckResponse } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })


const { $api } = useNuxtApp()

const nickname = ref('')
const nicknameStatus = ref<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid'>('idle')
const nicknameMessage = ref('')
const selectedJob = ref<JobType | null>(null)
const selectedAge = ref<AgeType | null>(null)
const selectedExperience = ref<ExperienceType | null>(null)
const isSaving = ref(false)
const originalNickname = ref('')

const jobs: { label: string; value: JobType }[] = [
  { label: '기획', value: 'PLANNER' },
  { label: '개발', value: 'DEVELOPER' },
  { label: '디자인', value: 'DESIGNER' },
]

const ages: { label: string; value: AgeType }[] = [
  { label: '20대', value: 'AGE_20' },
  { label: '30대', value: 'AGE_30' },
  { label: '40대 이상', value: 'AGE_40_PLUS' },
]

const experiences: { label: string; value: ExperienceType }[] = [
  { label: '1년 미만', value: 'LESS_THAN_1_YEAR' },
  { label: '1~2년', value: 'YEARS_1_TO_2' },
  { label: '3~5년', value: 'YEARS_3_TO_5' },
  { label: '6~9년', value: 'YEARS_6_TO_9' },
  { label: '10년 이상', value: 'YEARS_10_PLUS' },
]

const canSave = computed(() =>
  (nicknameStatus.value === 'available' || nickname.value === originalNickname.value)
  && selectedJob.value !== null
  && selectedAge.value !== null
  && selectedExperience.value !== null
  && nickname.value.length >= 2,
)

// 0.2초 디바운스로 중복 체크 (온보딩과 동일)
const debouncedCheckNickname = useDebounceFn(async () => {
  const value = nickname.value.trim()
  if (value.length < 2 || /[^가-힣a-zA-Z]/.test(value)) return
  await checkNickname()
}, 200)

watch(nickname, (value) => {
  nicknameMessage.value = ''
  if (value === originalNickname.value) {
    nicknameStatus.value = 'available'
    return
  }
  if (value.length === 0) {
    nicknameStatus.value = 'idle'
    return
  }
  nicknameStatus.value = 'idle'
  if (value.length >= 2) {
    debouncedCheckNickname()
  }
})

async function onNicknameEnter() {
  const value = nickname.value.trim()
  if (value.length < 2 || /[^가-힣a-zA-Z]/.test(value)) return
  if (nicknameStatus.value === 'checking' || nicknameStatus.value === 'available') return
  await checkNickname()
}

async function checkNickname() {
  const value = nickname.value.trim()
  if (value.length < 2) return
  if (/[^가-힣a-zA-Z]/.test(value)) {
    nicknameStatus.value = 'invalid'
    nicknameMessage.value = '공백, 숫자, 특수문자는 사용할 수 없어요'
    return
  }
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

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    const data = res.data.data
    nickname.value = data.nickname ?? ''
    selectedJob.value = data.job ?? null
    selectedAge.value = data.age ?? null
    selectedExperience.value = data.experience ?? null
    originalNickname.value = nickname.value
    // 저장된 닉네임은 이미 유효함
    nicknameStatus.value = 'available'
  } catch {
    // 오류 처리
  }
})

async function onSave() {
  if (!canSave.value || isSaving.value) return
  try {
    isSaving.value = true
    await $api.patch('/api/v2/users/profile', {
      nickname: nickname.value,
      job: selectedJob.value,
      age: selectedAge.value,
      experience: selectedExperience.value,
    })
    navigateTo('/my')
  } catch {
    // 오류 처리
  } finally {
    isSaving.value = false
  }
}
</script>

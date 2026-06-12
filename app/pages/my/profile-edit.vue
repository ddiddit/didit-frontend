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
        :class="canSave ? 'text-primary' : 'text-grey-5'"
        :disabled="!canSave || isSaving"
        @click="onSave"
      >
        저장
      </button>
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto px-5 pt-6">

      <!-- 닉네임 -->
      <div class="mb-7">
        <UiTextInput
          v-model="nickname"
          label="닉네임"
          hint="한글 또는 영문 2~10자"
          :error="nicknameError"
          :success="isNicknameValid"
          :maxlength="10"
          :show-count="true"
          @input="onNicknameInput"
        />
      </div>

      <!-- 직무 선택 -->
      <div>
        <label class="text-label1 font-medium text-grey-13 mb-3 block">직무 선택</label>
        <div class="grid grid-cols-3 gap-[10px]">
          <UiButton
            v-for="chip in jobChips"
            :key="chip.value"
            variant="chip"
            size="md"
            :active="selectedJob === chip.value"
            :muted="selectedJob !== null && selectedJob !== chip.value"
            @click="selectedJob = chip.value"
          >{{ chip.label }}</UiButton>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, UserProfile, JobType } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const hideTabBar = useState('hideTabBar', () => false)
onMounted(() => { hideTabBar.value = true })
onUnmounted(() => { hideTabBar.value = false })

const { $api } = useNuxtApp()

const nickname = ref('')
const selectedJob = ref<JobType>('PLANNER')
const nicknameError = ref('')
const isSaving = ref(false)
const originalNickname = ref('')

const jobChips: { label: string; value: JobType }[] = [
  { label: '기획', value: 'PLANNER' },
  { label: '개발', value: 'DEVELOPER' },
  { label: '디자인', value: 'DESIGNER' },
]

const isNicknameValid = computed(() => {
  const v = nickname.value
  return /^[가-힣a-zA-Z0-9]{2,10}$/.test(v) && !nicknameError.value
})

const canSave = computed(() => isNicknameValid.value)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    nickname.value = res.data.data.nickname ?? ''
    selectedJob.value = res.data.data.job ?? 'PLANNER'
    originalNickname.value = nickname.value
  } catch {
    // 오류 처리
  }
})

function onNicknameInput() {
  nicknameError.value = ''
}

async function onSave() {
  if (!canSave.value || isSaving.value) return

  // 닉네임이 변경된 경우에만 중복 검사
  if (nickname.value !== originalNickname.value) {
    try {
      const res = await $api.get<ApiResponse<{ isDuplicate: boolean }>>(
        `/api/v1/users/nickname/check?nickname=${encodeURIComponent(nickname.value)}`,
      )
      if (res.data.data.isDuplicate) {
        nicknameError.value = '이미 사용 중인 닉네임이에요.'
        return
      }
    } catch {
      return
    }
  }

  try {
    isSaving.value = true
    await $api.patch('/api/v2/users/profile', {
      nickname: nickname.value,
      job: selectedJob.value,
    })
    navigateTo('/my')
  } catch {
    // 오류 처리
  } finally {
    isSaving.value = false
  }
}
</script>

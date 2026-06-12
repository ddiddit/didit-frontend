<template>
  <div class="h-full bg-grey-3 flex flex-col overflow-y-auto">

    <!-- 프로필 섹션 -->
    <button
      class="px-5 py-[18px] flex items-center gap-4 text-left"
      @click="navigateTo('/my/profile-edit')"
    >
      <img src="/icons/avatar-default.svg" alt="프로필" class="w-12 h-12 rounded-full shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-label2 font-semibold text-primary">{{ jobLabel }}</p>
        <p class="text-heading2 font-semibold text-grey-13">{{ profile?.nickname ?? '' }}</p>
      </div>
      <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5 shrink-0" />
    </button>

    <!-- 설정 그룹 -->
    <div class="mx-5 mb-3 bg-white rounded-2xl p-2">
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/notification-settings')"
      >
        <span class="text-body2 font-medium text-grey-10">알림 설정</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">계정 관리</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="h-[48px] px-3 flex items-center justify-between">
        <span class="text-body2 font-medium text-grey-10">앱 버전</span>
        <span class="text-label1 font-normal text-grey-7">1.2.0</span>
      </div>
    </div>

    <!-- 고객지원 -->
    <div class="mx-5 mb-3 bg-white rounded-2xl p-2">
      <p class="text-label1 font-normal text-grey-7 px-3 h-[44px] flex items-center">고객지원</p>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">공지사항</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">문의하기</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
    </div>

    <!-- 이용약관 -->
    <div class="mx-5 mb-6 bg-white rounded-2xl p-2">
      <p class="text-label1 font-normal text-grey-7 px-3 h-[44px] flex items-center">이용약관</p>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">서비스 이용약관</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">개인정보 처리방침</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">마케팅 정보 수신 동의 안내</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <button class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3">
        <span class="text-body2 font-medium text-grey-10">야간 푸시 알림 동의 안내</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, UserProfile, JobType } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const profile = ref<UserProfile | null>(null)

const jobLabels: Record<JobType, string> = {
  PLANNER: '기획자',
  DEVELOPER: '개발자',
  DESIGNER: '디자이너',
}

const jobLabel = computed(() => (profile.value?.job ? jobLabels[profile.value.job] : ''))

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    profile.value = res.data.data
  } catch {
    // 오류 처리
  }
})
</script>

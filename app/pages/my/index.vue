<template>
  <div class="h-full bg-grey-3 flex flex-col overflow-y-auto">

    <!-- 프로필 섹션 -->
    <button
      class="px-5 py-[18px] flex items-center gap-3 text-left"
      @click="navigateTo('/my/profile-edit')"
    >
      <img src="/icons/avatar-default.svg" alt="프로필" class="w-12 h-12 rounded-full shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-caption1 font-medium text-primary leading-[1.4]">{{ jobLabel }}</p>
        <p class="text-body2 font-semibold text-grey-13">{{ profile?.nickname ?? '' }}</p>
      </div>
      <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5 shrink-0" />
    </button>

    <!-- 설정 그룹 -->
    <div class="mx-5 mb-3 bg-white rounded-2xl overflow-hidden">
      <button
        class="w-full h-[48px] px-4 flex items-center justify-between"
        @click="navigateTo('/my/notification-settings')"
      >
        <span class="text-body2 font-normal text-grey-13">알림 설정</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">계정 관리</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <div class="h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">앱 버전</span>
        <span class="text-label1 font-normal text-grey-7">1.0.0</span>
      </div>
    </div>

    <!-- 고객지원 -->
    <p class="text-label1 font-normal text-grey-7 px-5 pb-2">고객지원</p>
    <div class="mx-5 mb-3 bg-white rounded-2xl overflow-hidden">
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">공지사항</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">문의하기</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
    </div>

    <!-- 이용약관 -->
    <p class="text-label1 font-normal text-grey-7 px-5 pb-2">이용약관</p>
    <div class="mx-5 mb-6 bg-white rounded-2xl overflow-hidden">
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">서비스 이용약관</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">개인정보 처리방침</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">마케팅 정보 수신 동의 안내</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
      </button>
      <div class="mx-4 h-px bg-grey-5" />
      <button class="w-full h-[48px] px-4 flex items-center justify-between">
        <span class="text-body2 font-normal text-grey-13">야간 푸시 알림 동의 안내</span>
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
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v1/users/profile')
    profile.value = res.data.data
  } catch {
    // 오류 처리
  }
})
</script>

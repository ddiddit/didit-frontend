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
        <div class="flex items-center gap-[7px]">
          <p class="text-heading2 font-semibold text-grey-13 truncate">{{ profile?.nickname ?? '' }}</p>
          <!-- 레벨 배지 -->
          <span class="shrink-0 px-[6px] py-[2px] rounded-[5px] bg-[#89B6FF]/40 text-[#639FFF] text-[11px] font-semibold leading-[130%] tracking-[-0.02em]">Lv.{{ profile?.level ?? 1 }}</span>
        </div>
      </div>
      <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6 shrink-0" />
    </button>

    <!-- 목표 달성 배지 -->
    <button
      class="mx-5 mb-3 bg-white rounded-2xl px-5 flex flex-col"
      @click="navigateTo('/badges')"
    >
      <div class="h-[64px] flex items-center justify-between">
        <span class="text-body2 font-medium text-grey-13">목표 달성 배지</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </div>
      <!-- 획득 배지 1개: 최근 획득 배지 단일 박스 -->
      <div v-if="acquiredBadges.length === 1" class="pb-4">
        <div class="rounded-2xl bg-grey-3 px-5 py-6 flex flex-col items-center gap-1">
          <img :src="acquiredBadges[0]?.image" :alt="acquiredBadges[0]?.name" class="h-[88px] object-contain mb-1" />
          <p class="text-caption1 font-medium text-grey-7">최근에 획득한 배지</p>
          <p class="text-body2 font-semibold text-grey-13">{{ acquiredBadges[0]?.name }}</p>
        </div>
      </div>

      <!-- 획득 배지 2개 이상: 2열 그리드 -->
      <div v-else-if="acquiredBadges.length >= 2" class="pb-4 grid grid-cols-2 gap-3">
        <div
          v-for="b in acquiredBadges"
          :key="b.code"
          class="rounded-2xl bg-grey-3 py-5 flex flex-col items-center gap-2"
        >
          <img :src="b.image" :alt="b.name" class="h-[72px] object-contain" />
          <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">{{ b.name }}</p>
        </div>
      </div>
    </button>

    <!-- 설정 그룹 -->
    <div class="mx-5 mb-3 bg-white rounded-2xl p-2">
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/notification-settings')"
      >
        <span class="text-body2 font-medium text-grey-10">알림 설정</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/account')"
      >
        <span class="text-body2 font-medium text-grey-10">계정 관리</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <div class="h-[48px] px-3 flex items-center justify-between">
        <span class="text-body2 font-medium text-grey-10">앱 버전</span>
        <span class="text-label1 font-normal text-grey-7">1.2.0</span>
      </div>
    </div>

    <!-- 고객지원 -->
    <div class="mx-5 mb-3 bg-white rounded-2xl p-2">
      <p class="text-label1 font-semibold text-grey-7 px-3 h-[44px] flex items-center">고객지원</p>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/notices')"
      >
        <span class="text-body2 font-medium text-grey-10">공지사항</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/inquiry')"
      >
        <span class="text-body2 font-medium text-grey-10">문의하기</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
    </div>

    <!-- 이용약관 -->
    <div class="mx-5 mb-6 bg-white rounded-2xl p-2">
      <p class="text-label1 font-semibold text-grey-7 px-3 h-[44px] flex items-center">이용약관</p>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/terms/service')"
      >
        <span class="text-body2 font-medium text-grey-10">서비스 이용약관</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/terms/privacy')"
      >
        <span class="text-body2 font-medium text-grey-10">개인정보 처리방침</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/terms/marketing')"
      >
        <span class="text-body2 font-medium text-grey-10">마케팅 정보 수신 동의 안내</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/my/terms/night-push')"
      >
        <span class="text-body2 font-medium text-grey-10">야간 푸시 알림 동의 안내</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
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

// 획득 배지 (목표 달성 배지 카드 미리보기용, 최근 획득순)
const { badges, load: loadBadges } = useBadges()
const acquiredBadges = computed(() =>
  badges.value
    .filter(b => b.acquired)
    .sort((a, b) => {
      const ta = a.acquiredAt ? new Date(a.acquiredAt).getTime() : 0
      const tb = b.acquiredAt ? new Date(b.acquiredAt).getTime() : 0
      return tb - ta
    }),
)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    profile.value = res.data.data
  } catch {
    // 오류 처리
  }
  loadBadges()
})
</script>

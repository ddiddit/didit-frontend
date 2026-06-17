<template>
  <div class="h-full bg-grey-3 flex flex-col overflow-y-auto scrollbar-hide">

    <!-- 프로필 섹션 -->
    <button
      class="px-5 py-[18px] flex items-center gap-4 text-left"
      @click="navigateTo('/my/profile-edit')"
    >
      <img src="/icons/avatar-default.svg" alt="프로필" class="w-[46px] h-[46px] rounded-full shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-label2 font-semibold text-grey-7">{{ jobLabel }}</p>
        <div class="flex items-center gap-[7px]">
          <p class="text-heading1 font-semibold text-grey-13 truncate">{{ profile?.nickname ?? '' }}</p>
          <!-- 레벨 배지 -->
          <span class="shrink-0 px-[6px] py-[3px] rounded-[6px] bg-[rgba(90,141,238,0.15)] text-[#5A8DEE] text-[11px] font-semibold leading-[130%] tracking-[-0.02em]">Lv.{{ profile?.level ?? 1 }}</span>
        </div>
      </div>
      <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6 shrink-0" />
    </button>

    <!-- 목표 달성 배지 -->
    <div class="mx-5 mb-[10px] bg-white rounded-2xl p-2">
      <button
        class="w-full h-[48px] px-3 flex items-center justify-between rounded-[10px] active:bg-grey-3"
        @click="navigateTo('/badges')"
      >
        <span class="text-body2 font-medium text-grey-10">목표 달성 배지</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
      </button>
      <!-- 획득 배지 미리보기: 최대 2개, 2열 그리드 -->
      <div v-if="acquiredBadges.length > 0" class="mt-2 mb-2 px-2 grid grid-cols-2 gap-[10px]">
        <div
          v-for="b in acquiredBadges.slice(0, 2)"
          :key="b.code"
          class="rounded-[14px] bg-grey-3 flex flex-col items-center pt-3 gap-1 pb-5"
        >
          <img :src="b.image" :alt="b.name" class="h-24 object-contain" />
          <p class="text-label2 font-medium text-grey-8 text-center">{{ b.name }}</p>
        </div>
      </div>
    </div>

    <!-- 설정 그룹 -->
    <div class="mx-5 mb-[10px] bg-white rounded-2xl p-2">
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
    <div class="mx-5 mb-[10px] bg-white rounded-2xl p-2">
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
import type { JobType } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { profile, load: loadProfile } = useProfile()
const { track } = useAmplitude()

const jobLabels: Record<JobType, string> = {
  PLANNER: '기획자',
  DEVELOPER: '개발자',
  DESIGNER: '디자이너',
}

const jobLabel = computed(() => (profile.value?.job ? jobLabels[profile.value.job] : ''))

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

onMounted(() => {
  track('my_page_viewed')
  loadProfile()
  loadBadges()
})
</script>

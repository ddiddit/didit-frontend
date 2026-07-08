<template>
  <div class="flex flex-col h-full relative">

    <!-- 프리뷰 컨트롤 (탭바 위 플로팅 — 프로필 영역 가리지 않게 하단 배치) -->
    <div class="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-[60] flex gap-2 whitespace-nowrap">
      <button
        class="px-3 py-1.5 rounded-lg text-label2 font-semibold shadow-md"
        :class="isExisting ? 'bg-grey-13 text-grey-1' : 'bg-grey-5 text-grey-13'"
        @click="isExisting = true"
      >기존 유저 (회고 있음)</button>
      <button
        class="px-3 py-1.5 rounded-lg text-label2 font-semibold shadow-md"
        :class="!isExisting ? 'bg-grey-13 text-grey-1' : 'bg-grey-5 text-grey-13'"
        @click="isExisting = false"
      >신규 유저</button>
    </div>

    <!-- 마이페이지 실제 화면 재현 (app/pages/my/index.vue와 동일 마크업) -->
    <div class="flex-1 overflow-hidden min-h-0">
      <div class="h-full bg-grey-3 flex flex-col overflow-y-auto scrollbar-hide relative">

        <!-- 프로필 섹션 -->
        <button class="px-5 py-[30px] flex items-center gap-4 text-left">
          <img src="/icons/avatar-default.svg" alt="프로필" class="w-[46px] h-[46px] rounded-full shrink-0" />
          <div class="flex-1 min-w-0 flex flex-col gap-px">
            <p class="text-label2 font-semibold text-grey-7">{{ jobLabel }}</p>
            <div class="flex items-center gap-[7px]">
              <p class="text-heading1 font-semibold text-grey-13 truncate">{{ profile.nickname }}</p>
              <!-- 레벨 배지 -->
              <span
                class="shrink-0 inline-flex items-center px-[6px] py-[3px] rounded-[6px] text-[11px] font-semibold leading-[1.3] tracking-[-0.02em]"
                :style="{ backgroundColor: levelTheme(displayLevel).light, color: levelTheme(displayLevel).accent }"
              >Lv.{{ displayLevel }}</span>
            </div>
          </div>
          <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6 shrink-0" />
        </button>

        <!-- 목표 달성 배지 -->
        <div class="mx-5 mb-[10px] bg-white rounded-2xl p-2">
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">목표 달성 배지</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <div v-if="acquiredBadges.length > 0" class="mt-2 mb-2 px-2 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[10px]">
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
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">알림 설정</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">계정 관리</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <div class="h-[48px] pl-3 pr-1.5 flex items-center justify-between">
            <span class="text-body2 font-medium text-grey-10">앱 버전</span>
            <span class="text-label1 font-medium text-grey-7">{{ version }}</span>
          </div>
        </div>

        <!-- 고객지원 -->
        <div class="mx-5 mb-[10px] bg-white rounded-2xl p-2">
          <p class="text-label1 font-semibold text-grey-7 pl-3 pr-1.5 h-[44px] flex items-center">고객지원</p>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">공지사항</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">문의하기</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
        </div>

        <!-- 이용약관 -->
        <div class="mx-5 mb-10 bg-white rounded-2xl p-2">
          <p class="text-label1 font-semibold text-grey-7 pl-3 pr-1.5 h-[44px] flex items-center">이용약관</p>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">서비스 이용약관</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">개인정보 처리방침</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">마케팅 정보 수신 동의 안내</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
          <button class="w-full h-[48px] pl-3 pr-1.5 flex items-center justify-between rounded-[10px] active:bg-grey-3">
            <span class="text-body2 font-medium text-grey-10">야간 푸시 알림 동의 안내</span>
            <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>

    <!-- 하단 탭바 (LayoutBottomTabBar와 동일 마크업, '마이' 활성 고정) -->
    <nav class="shrink-0 bg-white w-full" style="border-top: 1px solid #E8E8E8;">
      <div class="flex items-center justify-around" style="padding-top: 12px; padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));">
        <div v-for="tab in tabs" :key="tab.label" class="flex flex-col items-center gap-1">
          <img
            :src="tab.active ? tab.iconActive : tab.icon"
            :alt="tab.label"
            class="w-6 h-6"
            :style="tab.active ? 'filter: brightness(0) invert(1) brightness(0.098)' : 'filter: brightness(0) invert(1) brightness(0.596)'"
          />
          <span class="text-caption1 font-bold" :class="tab.active ? 'text-grey-13' : 'text-grey-7'">{{ tab.label }}</span>
        </div>
      </div>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { levelTheme } from '~/utils/levelTheme'

// 개발 전용 레벨 UI 프리뷰 — 마이페이지 화면을 실제 마크업 그대로 목데이터로 확인
definePageMeta({ layout: false })

// 프로덕션에서는 접근 차단
if (!import.meta.dev) navigateTo('/home')

const { version } = useAppVersion()

// 기존 유저(회고 있음, currentLevel=1) ↔ 신규 유저(currentLevel=0) 전환
const isExisting = ref(true)

const profile = computed(() =>
  isExisting.value
    ? { nickname: '디딧러버', job: 'DEVELOPER', currentLevel: 1 }
    : { nickname: '새싹유저', job: 'DEVELOPER', currentLevel: 0 },
)

const jobLabel = computed(() => '개발자')

// 마이페이지와 동일한 표시 레벨 로직: 달성 레벨 최소 1
const displayLevel = computed(() => Math.max(profile.value.currentLevel, 1))

// 기존 유저는 '첫 기록' 배지 획득 상태
const acquiredBadges = computed(() =>
  isExisting.value
    ? [{ code: 'first-record', name: '첫 기록', image: '/badges/first-record.svg' }]
    : [],
)

const tabs = [
  { label: '홈', icon: '/icons/tab-home.svg', iconActive: '/icons/tab-home-active.svg', active: false },
  { label: '회고 기록', icon: '/icons/tab-retrospect.svg', iconActive: '/icons/tab-retrospect-active.svg', active: false },
  { label: '마이', icon: '/icons/tab-profile.svg', iconActive: '/icons/tab-profile-active.svg', active: true },
]
</script>

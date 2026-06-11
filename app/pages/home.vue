<template>
  <div class="h-full bg-background flex flex-col relative">

    <!-- 헤더: H:50, 벨 아이콘만 우측 -->
    <header
      class="flex items-center justify-end px-5 h-[50px] shrink-0"
      style="margin-top: max(54px, env(safe-area-inset-top, 54px));"
    >
      <button class="p-1" @click="goToNotifications">
        <img
          :src="hasUnread ? '/icons/bell-on.svg' : '/icons/bell-off.svg'"
          alt="알림"
          class="w-6 h-6"
        />
      </button>
    </header>

    <!-- 인사말: 닉네임 + 문구 -->
    <div class="px-5 shrink-0">
      <template v-if="isLoading">
        <span class="inline-block w-24 h-6 bg-grey-4 rounded animate-pulse mb-1 block" />
        <span class="inline-block w-52 h-6 bg-grey-4 rounded animate-pulse block" />
      </template>
      <h1 v-else class="text-title3 font-bold text-grey-13 leading-[1.4]">
        {{ nickname }}님,<br />
        {{ greetingMessage }}
      </h1>
    </div>

    <!-- 빈 상태: 세로 중앙 정렬 -->
    <div
      v-if="!isLoading && recentRetrospectives.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-3 pb-16"
    >
      <img src="/icons/empty-home.svg" alt="" class="w-[70px] h-[70px]" />

      <div class="text-center flex flex-col items-center gap-[6px]">
        <!-- Heading 2/SemiBold: 18px/140% -->
        <p class="text-heading2 font-semibold text-grey-13">
          아직 작성한 회고가 없어요
        </p>
        <!-- Regular 14px/160%, #575757 = grey-9 -->
        <p class="text-label1-reading font-normal text-grey-9 text-center">
          회고를 시작하고<br />오늘의 일을 기록해 보세요!
        </p>
      </div>

      <!-- 회고 시작하기 버튼: H:42, radius:12, gap:4 / 텍스트↔버튼 40px (gap-3 12px + mt-7 28px) -->
      <button
        class="flex items-center gap-1 mt-7 px-[18px] h-[42px] bg-primary rounded-xl"
        @click="startRetrospect"
      >
        <img src="/icons/add.png" alt="" class="w-6 h-6" />
        <span class="text-body2 font-semibold text-grey-13">회고 시작하기</span>
      </button>
    </div>

    <!-- 회고 있음 (추후 구현) -->
    <div v-else-if="!isLoading && recentRetrospectives.length > 0" class="flex-1 px-5 pt-4">
      <!-- TODO: 회고 카드 목록 -->
    </div>

    <!-- FAB + 툴팁 -->
    <div
      v-if="!isLoading"
      class="absolute right-5 flex items-center gap-[14px]"
      style="bottom: 16px;"
    >
      <!-- 툴팁 버블 -->
      <div
        class="relative flex items-center h-[38px] px-[8px] rounded-xl"
        :class="isCompleted ? 'bg-grey-5' : 'bg-grey-10'"
        style="box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
      >
        <span v-if="!isCompleted" class="text-label1 font-medium text-grey-1 whitespace-nowrap">
          오늘 남은 회고 횟수&nbsp;<span class="text-label1 font-semibold text-primary">{{ remaining }}</span><span class="text-label1 font-medium text-grey-7">/{{ maxDaily }}</span>
        </span>
        <span v-else class="text-label1 font-medium text-grey-7 whitespace-nowrap">
          오늘 회고 {{ maxDaily }}회 완료
        </span>
        <!-- 오른쪽 꼬리: 피그마 Polygon 1.svg -->
        <svg
          class="absolute -right-[9px] top-1/2 -translate-y-1/2"
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0328 3.87689C11.4819 4.62057 11.4819 6.69193 10.0328 7.43561L2.91317 11.0894C1.58225 11.7724 1.56809e-07 10.806 1.3897e-07 9.31005L5.18278e-08 2.00244C3.39887e-08 0.506487 1.58224 -0.459945 2.91317 0.223086L10.0328 3.87689Z"
            :fill="isCompleted ? '#E6E6E6' : '#3C3C3C'"
          />
        </svg>
      </div>

      <!-- FAB -->
      <button
        class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        :class="isCompleted ? 'bg-grey-5 cursor-not-allowed' : 'bg-primary'"
        :disabled="isCompleted"
        @click="startRetrospect"
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.75 16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75V16.25Z"
            :fill="isCompleted ? '#989898' : '#191919'"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, HomeResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()

// 페이지 이동 후 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const nickname = useState<string>('home:nickname', () => '')
const recentRetrospectives = useState<HomeResponse['recentRetrospectives']>('home:retrospectives', () => [])
const todayRetrospectiveCount = useState<number>('home:todayCount', () => 0)
const hasUnread = ref(false)

// 캐시된 데이터가 있으면 로딩 스켈레톤 생략
const isLoading = ref(nickname.value === '')

const maxDaily = 3
const remaining = computed(() => Math.max(0, maxDaily - todayRetrospectiveCount.value))
const isCompleted = computed(() => remaining.value === 0)

const greetingMessage = computed(() =>
  recentRetrospectives.value.length === 0 ? '첫 회고를 시작해볼까요?' : '오늘도 성장하는 하루 보내세요!',
)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<HomeResponse>>('/api/v1/home')
    nickname.value = res.data.data.nickname
    recentRetrospectives.value = res.data.data.recentRetrospectives
    todayRetrospectiveCount.value = res.data.data.todayRetrospectiveCount
  } catch {
    // 401/403은 axios 인터셉터가 처리
  } finally {
    isLoading.value = false
  }
})

function goToNotifications() {
  navigateTo('/notifications')
}

function startRetrospect() {
  navigateTo('/retrospect/start')
}
</script>

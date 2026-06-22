<template>
  <div class="h-full bg-background flex flex-col relative">

    <!-- 헤더: H:50, 벨 아이콘만 우측 -->
    <header
      class="flex items-center justify-end px-5 h-[50px] shrink-0"
    >
      <button @click="goToNotifications">
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
      <h1 v-else class="text-title3 font-semibold text-grey-13 leading-[1.4]">
        {{ nickname }}님,<br />
        {{ greetingMessage }}
      </h1>
    </div>

    <!-- 빈 상태: 세로 중앙 정렬 -->
    <div
      v-if="!isLoading && recentRetrospectives.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-[40px] pb-16"
    >
      <!-- 아이콘 + 텍스트 그룹 -->
      <div class="flex flex-col items-center gap-3">
        <img src="/icons/empty-home.svg" alt="" class="w-[70px] h-[70px] rounded-[12px]" />
        <div class="flex flex-col items-center gap-[6px]">
          <p class="text-heading2 font-semibold text-grey-13">아직 작성한 회고가 없어요</p>
          <p class="text-label1-reading font-normal text-grey-9 text-center">
            회고를 시작하고<br />오늘의 일을 기록해 보세요!
          </p>
        </div>
      </div>

      <!-- 회고 시작하기 버튼 -->
      <button
        class="flex items-center gap-1 pl-[12px] pr-[18px] py-[9px] bg-primary rounded-xl"
        @click="startRetrospect"
      >
        <img src="/icons/add.svg" alt="" class="w-6 h-6" />
        <span class="text-body2 font-semibold text-grey-13">회고 시작하기</span>
      </button>
    </div>

    <!-- 회고 있음: 나의 최근 회고 목록 -->
    <div
      v-else-if="!isLoading && recentRetrospectives.length > 0"
      class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pt-4 pb-24"
    >
      <div class="flex flex-col gap-[14px]">
        <p class="text-body2 font-semibold text-grey-9">나의 최근 회고</p>
        <div class="flex flex-col gap-3">
          <button
            v-for="r in recentRetrospectives"
            :key="r.id"
            class="bg-white rounded-2xl text-left"
            style="padding: 22px 22px 20px"
            @click="navigateTo(`/retrospects/${r.id}`)"
          >
            <div class="flex flex-col gap-[10px]">
              <div class="flex flex-col gap-[2px]">
                <span v-if="r.completedAt" class="text-caption1 font-medium text-grey-7">
                  {{ formatDate(r.completedAt) }}
                </span>
                <p class="text-body2 font-semibold text-grey-13">{{ r.title }}</p>
              </div>
              <p v-if="r.summary" class="text-label1 font-normal text-grey-10 leading-[1.6] line-clamp-3">
                {{ r.summary }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- FAB + 툴팁: 회고 있을 때만 표시 -->
    <div
      v-if="!isLoading && recentRetrospectives.length > 0"
      class="absolute right-5 flex items-center gap-[14px]"
      style="bottom: 16px;"
    >
      <!-- 툴팁 버블 (figma: bg #3C3C3C, padding 9/14, radius 8, 흰 텍스트) -->
      <div
        class="relative flex items-center px-[14px] py-[9px] rounded-lg bg-grey-10"
        style="box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
      >
        <span v-if="!isCompleted" class="text-label1 font-medium text-grey-1 whitespace-nowrap">
          오늘 남은 회고 횟수&nbsp;<span class="text-label1 font-semibold text-primary">{{ remaining }}</span><span class="text-label1 font-medium text-grey-7">/{{ maxDaily }}</span>
        </span>
        <span v-else class="text-label1 font-medium text-grey-1 whitespace-nowrap">
          오늘 회고 {{ maxDaily }}회 완료
        </span>
        <!-- 오른쪽 꼬리: 피그마 Polygon 1.svg -->
        <svg
          class="absolute -right-[8px] top-1/2 -translate-y-1/2"
          width="13" height="16" viewBox="0 0 12 12" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0328 3.87689C11.4819 4.62057 11.4819 6.69193 10.0328 7.43561L2.91317 11.0894C1.58225 11.7724 1.56809e-07 10.806 1.3897e-07 9.31005L5.18278e-08 2.00244C3.39887e-08 0.506487 1.58224 -0.459945 2.91317 0.223086L10.0328 3.87689Z"
            fill="#3C3C3C"
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
import type { ApiResponse, HomeResponse, NotificationHistory } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const { track } = useAmplitude()

// 페이지 이동 후 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const nickname = useState<string>('home:nickname', () => '')
const recentRetrospectives = useState<HomeResponse['recentRetrospectives']>('home:retrospectives', () => [])
const todayRetrospectiveCount = useState<number>('home:todayCount', () => 0)
// 알림 미읽음 여부는 알림 페이지와 상태를 공유 (읽음 처리 시 벨 아이콘 즉시 갱신)
const hasUnread = useState<boolean>('notifications:hasUnread', () => false)

// 캐시된 데이터가 있으면 로딩 스켈레톤 생략
const isLoading = ref(nickname.value === '')

const maxDaily = 3
const remaining = computed(() => Math.max(0, maxDaily - todayRetrospectiveCount.value))
const isCompleted = computed(() => remaining.value === 0)

const greetingMessage = computed(() =>
  recentRetrospectives.value.length === 0 ? '첫 회고를 시작해볼까요?' : '오늘 어떤 일을 하셨나요?',
)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  track('home_viewed')
  try {
    const [homeRes, notifRes] = await Promise.all([
      $api.get<ApiResponse<HomeResponse>>('/api/v1/home'),
      $api.get<ApiResponse<NotificationHistory[]>>('/api/v1/notification-histories'),
    ])
    nickname.value = homeRes.data.data.nickname
    recentRetrospectives.value = homeRes.data.data.recentRetrospectives
    todayRetrospectiveCount.value = homeRes.data.data.todayRetrospectiveCount
    hasUnread.value = notifRes.data.data.some(n => !n.isRead)
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
  track('retrospect_started')
  navigateTo('/retrospect/start')
}
</script>

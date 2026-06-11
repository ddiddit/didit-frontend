<template>
  <div class="h-full bg-background flex flex-col relative">

    <!-- 헤더: H:50, 벨 아이콘만 우측 -->
    <header
      class="flex items-center justify-end px-5 h-[50px] shrink-0"
      style="margin-top: max(54px, env(safe-area-inset-top, 54px));"
    >
      <button class="relative p-1" @click="goToNotifications">
        <img
          :src="hasUnread ? '/icons/bell-on.png' : '/icons/bell-off.png'"
          alt="알림"
          class="w-6 h-6"
        />
        <span v-if="hasUnread" class="absolute top-1 right-1 w-[6px] h-[6px] bg-primary rounded-full" />
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

    <!-- 플로팅 액션 버튼 -->
    <button
      class="absolute right-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center"
      style="bottom: calc(max(28px, env(safe-area-inset-bottom, 28px)) + 56px + 16px); box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
      @click="startRetrospect"
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <path d="M15 7V23M7 15H23" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, HomeResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()

// 페이지 이동 후 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const nickname = useState<string>('home:nickname', () => '')
const recentRetrospectives = useState<HomeResponse['recentRetrospectives']>('home:retrospectives', () => [])
const hasUnread = ref(false)

// 캐시된 데이터가 있으면 로딩 스켈레톤 생략
const isLoading = ref(nickname.value === '')

const greetingMessage = computed(() =>
  recentRetrospectives.value.length === 0 ? '첫 회고를 시작해볼까요?' : '오늘도 성장하는 하루 보내세요!',
)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<HomeResponse>>('/api/v1/home')
    nickname.value = res.data.data.nickname
    recentRetrospectives.value = res.data.data.recentRetrospectives
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

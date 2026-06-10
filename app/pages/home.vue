<template>
  <div class="h-full bg-background flex flex-col">
    <!-- 헤더: 벨 아이콘만 우측 -->
    <header class="flex justify-end px-5 pt-14 pb-2 shrink-0">
      <button class="p-1" @click="goToNotifications">
        <img
          :src="hasUnread ? '/icons/bell-on.png' : '/icons/bell-off.png'"
          alt="알림"
          class="w-6 h-6"
        />
      </button>
    </header>

    <!-- 인사말 -->
    <div class="px-5 pt-1 pb-0 shrink-0">
      <h1 class="text-heading1 font-bold text-gray-900 leading-snug">
        <template v-if="isLoading">
          <span class="inline-block w-24 h-6 bg-gray-200 rounded animate-pulse mb-1 block" />
          <span class="inline-block w-52 h-6 bg-gray-200 rounded animate-pulse block" />
        </template>
        <template v-else>
          {{ nickname }}님,<br />
          {{ greetingMessage }}
        </template>
      </h1>
    </div>

    <!-- 빈 상태 (flex-1, 세로 중앙 정렬) -->
    <div
      v-if="!isLoading && recentRetrospectives.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-3 pb-4"
    >
      <!-- 70×70, border-radius 12, 배경 없음 -->
      <div class="w-[70px] h-[70px] rounded-[12px] overflow-hidden">
        <img src="/icon-empty.png" alt="" class="w-full h-full object-contain" />
      </div>

      <div class="text-center flex flex-col items-center gap-1">
        <!-- Heading 2/Bold: 18px, line-height 140%, grey-13 -->
        <p class="font-bold text-[#191919]" style="font-size:18px;line-height:1.4;">
          아직 작성한 회고가 없어요
        </p>
        <!-- Label 1/Reading: 14px, line-height 160%, grey-9 -->
        <p class="text-center text-[#575757]" style="font-size:14px;line-height:1.6;">
          회고를 시작하고<br />오늘의 일을 기록해 보세요!
        </p>
      </div>

      <button
        class="flex items-center gap-1.5 mt-3 px-6 py-3.5 bg-primary rounded-full text-white text-body2 font-bold"
        @click="startRetrospect"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        회고 시작하기
      </button>
    </div>

    <!-- 회고 있음 (추후 구현) -->
    <div v-else-if="!isLoading && recentRetrospectives.length > 0" class="flex-1 px-5 pt-4">
      <!-- TODO: 회고 카드 목록 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, HomeResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()

const isLoading = ref(true)
const nickname = ref('')
const recentRetrospectives = ref<HomeResponse['recentRetrospectives']>([])
const hasUnread = ref(false)

const greetingMessage = computed(() =>
  recentRetrospectives.value.length === 0 ? '첫 회고를 시작해볼까요?' : '오늘도 성장하는 하루 보내세요!',
)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<HomeResponse>>('/api/v1/home')
    nickname.value = res.data.data.nickname
    recentRetrospectives.value = res.data.data.recentRetrospectives
  } catch {
    // 401은 axios 인터셉터가 처리
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

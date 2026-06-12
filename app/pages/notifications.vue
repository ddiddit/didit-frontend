<template>
  <div class="h-full bg-background flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/home')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <div class="flex-1" />
      <button
        class="text-body2 font-semibold"
        :class="hasUnread ? 'text-primary' : 'text-grey-6'"
        :disabled="!hasUnread"
        @click="markAllRead"
      >
        전체 읽음
      </button>
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="!isLoading && displayNotifications.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <p class="text-[14px] font-normal text-grey-9 leading-[1.6] tracking-[-0.02em]">새로운 알림이 없어요.</p>
    </div>

    <!-- 알림 목록 -->
    <div v-else class="flex-1 overflow-y-auto scrollbar-hide">
      <ul>
        <li
          v-for="item in displayNotifications"
          :key="item.id"
          class="px-5 py-[18px] border-b border-grey-5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2 flex-1 min-w-0">
              <!-- 미읽음 초록 점 -->
              <span
                class="mt-[5px] w-[6px] h-[6px] rounded-full shrink-0 transition-colors"
                :class="item.isRead ? 'bg-transparent' : 'bg-primary'"
              />
              <div class="flex-1 min-w-0">
                <p class="text-label1 font-semibold text-grey-13 leading-[1.4]">{{ item.title }}</p>
                <p class="text-label1 font-normal text-grey-10 mt-[6px] leading-[1.5] whitespace-pre-line">{{ item.body }}</p>
              </div>
            </div>
            <span class="text-caption1 font-normal text-grey-7 shrink-0 mt-[2px]">{{ formatTime(item.createdAt) }}</span>
          </div>
        </li>
      </ul>

      <!-- 하단 안내 -->
      <p class="text-center text-caption1 font-normal text-grey-7 py-6">
        최근 30일 동안의 알림만 확인할 수 있어요.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, NotificationHistory } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()

const isLoading = ref(false)
const notifications = ref<NotificationHistory[]>([])

// 디자인 미리보기용 하드코딩 데이터
const PREVIEW_NOTIFICATIONS: NotificationHistory[] = [
  {
    id: 'p1',
    title: '회고 작성 알림',
    body: '하루를 마무리하며 오늘의 회고를 기록해 보세요.',
    isRead: false,
    createdAt: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'p2',
    title: '다음 행동을 제안했어요',
    body: '지난 회고를 바탕으로 추천하는 행동을 확인해 보세요.',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'p3',
    title: '추천하는 행동을 확인해 보세요',
    body: '오늘 하루는 어땠나요?\n5분 회고로 오늘을 정리해 보세요.',
    isRead: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'p4',
    title: '오늘 하루는 어땠나요?',
    body: '오늘 하루는 어땠나요?\n5분 회고로 오늘을 정리해 보세요.',
    isRead: true,
    createdAt: '2026-03-10T09:00:00.000Z',
  },
]

const displayNotifications = computed(() =>
  notifications.value.length > 0 ? notifications.value : PREVIEW_NOTIFICATIONS
)

const hasUnread = computed(() => displayNotifications.value.some(n => !n.isRead))

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NotificationHistory[]>>('/api/v1/notification-histories')
    notifications.value = res.data.data
  } catch {
    // 오류 시 PREVIEW_NOTIFICATIONS 표시
  } finally {
    isLoading.value = false
  }
})

async function markAllRead() {
  try {
    await $api.post('/api/v1/notification-histories/read-all')
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
  } catch {
    // 오류 처리
  }
}

function formatTime(createdAt: string): string {
  const now = new Date()
  const date = new Date(createdAt)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (hours < 1) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 30) return `${days}일 전`
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
</script>

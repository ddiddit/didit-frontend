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
        :class="hasUnread ? 'text-green-hover' : 'text-grey-6'"
        :disabled="!hasUnread"
        @click="markAllRead"
      >
        전체 읽음
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <span class="w-6 h-6 border-2 border-grey-5 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="notifications.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <p class="text-[14px] font-normal text-grey-9 leading-[1.6] tracking-[-0.02em]">새로운 알림이 없어요.</p>
    </div>

    <!-- 알림 목록 -->
    <div v-else class="flex-1 overflow-y-auto scrollbar-hide">
      <ul>
        <li
          v-for="item in notifications"
          :key="item.id"
          class="px-5 pt-[18px]"
          :class="(!item.isRead || !!item.link || item.type === 'INQUIRY_ANSWERED') ? 'cursor-pointer' : ''"
          @click="onNotificationClick(item)"
        >
          <div class="pb-[18px] border-b border-grey-5 flex items-start justify-between gap-2">
            <div class="flex items-start gap-[10px] flex-1 min-w-0">
              <!-- 미읽음 초록 점 (읽은 항목은 DOM에서 제거) -->
              <span
                v-if="!item.isRead"
                class="mt-[7px] w-[7px] h-[7px] rounded-full shrink-0 bg-primary"
              />
              <div class="flex-1 min-w-0">
                <p class="text-body2 font-semibold text-grey-13">{{ item.title }}</p>
                <p class="text-label1 font-normal text-grey-10 mt-[6px] leading-[1.6] whitespace-pre-line">{{ item.body }}</p>
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
import { parseServerDate } from '~/utils/date'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const { track } = useAmplitude()

const isLoading = ref(true)
const notifications = ref<NotificationHistory[]>([])

const hasUnread = computed(() => notifications.value.some(n => !n.isRead))

// 홈 벨 아이콘과 공유하는 미읽음 상태 — 읽음 처리 시 즉시 홈에 반영
const unreadFlag = useState<boolean>('notifications:hasUnread', () => false)
watch(hasUnread, value => { unreadFlag.value = value })

onMounted(async () => {
  track('notification_center_viewed')
  try {
    const res = await $api.get<ApiResponse<NotificationHistory[]>>('/api/v1/notification-histories')
    notifications.value = res.data.data
  } catch {
  } finally {
    isLoading.value = false
  }
})

function onNotificationClick(item: NotificationHistory) {
  track('notification_clicked', { type: item.type })
  markRead(item)
  // 백엔드가 내려준 link 우선 (예: 회고 결과 알림 → 회고 상세), 없으면 타입별 기본 이동
  if (item.link) {
    navigateTo(item.link)
  } else if (item.type === 'INQUIRY_ANSWERED') {
    navigateTo('/my/inquiry?from=notification')
  }
}

async function markRead(item: NotificationHistory) {
  if (item.isRead) return
  item.isRead = true
  try {
    await $api.put(`/api/v1/notification-histories/${item.id}/read`)
  } catch {
    item.isRead = false
  }
}

async function markAllRead() {
  try {
    await $api.put('/api/v1/notification-histories/read')
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
  } catch {
  }
}

function formatTime(createdAt: string): string {
  const now = new Date()
  const date = parseServerDate(createdAt)
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

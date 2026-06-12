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
        >
          <div class="pb-[18px] border-b border-grey-5 flex items-start justify-between gap-2">
            <div class="flex items-start gap-2 flex-1 min-w-0">
              <!-- 미읽음 초록 점 (읽은 항목은 DOM에서 제거) -->
              <span
                v-if="!item.isRead"
                class="mt-[7px] w-[6px] h-[6px] rounded-full shrink-0 bg-primary"
              />
              <div class="flex-1 min-w-0">
                <p class="text-body2 font-semibold text-grey-13">{{ item.title }}</p>
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

const isLoading = ref(true)
const notifications = ref<NotificationHistory[]>([])

const hasUnread = computed(() => notifications.value.some(n => !n.isRead))

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NotificationHistory[]>>('/api/v1/notification-histories')
    notifications.value = res.data.data
  } catch {
    // 오류 처리
  } finally {
    isLoading.value = false
  }
})

async function markAllRead() {
  try {
    await $api.put('/api/v1/notification-histories/read')
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

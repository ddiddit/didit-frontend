<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 닫기 헤더 -->
    <div class="h-[50px] px-5 flex items-center justify-end shrink-0">
      <button class="p-1 -mr-1" @click="navigateTo('/my/notices')">
        <img src="/icons/close.svg" alt="닫기" class="w-6 h-6" />
      </button>
    </div>

    <!-- 본문 -->
    <div v-if="notice" class="flex-1 overflow-y-auto px-5 pt-4 pb-10">
      <!-- 날짜 + 제목 -->
      <div class="flex flex-col gap-2 mb-5">
        <p class="text-caption1 font-normal text-grey-7">{{ formatDate(notice.createdAt) }}</p>
        <h1 class="text-heading2 font-semibold text-grey-13">{{ notice.title }}</h1>
      </div>

      <!-- 구분선 -->
      <div class="h-px bg-grey-5 mb-5" />

      <!-- 내용 -->
      <p class="text-body3-reading font-normal text-grey-10 whitespace-pre-line">{{ notice.content }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, NoticeDetail } from '~/types/api'
import { parseServerDate } from '~/utils/date'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })

const { $api } = useNuxtApp()
const route = useRoute()

const notice = ref<NoticeDetail | null>(null)

// ISO 날짜 → "2026.03.05"
function formatDate(iso: string): string {
  const d = parseServerDate(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NoticeDetail>>(`/api/v1/notices/${route.params.id}`)
    notice.value = res.data.data
  } catch {
    notice.value = null
  }
})
</script>

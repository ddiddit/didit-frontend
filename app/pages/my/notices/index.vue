<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">공지사항</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 목록 -->
    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- 빈 상태 -->
      <div v-if="!isLoading && notices.length === 0" class="flex items-center justify-center pt-20">
        <p class="text-body2 font-normal text-grey-7">등록된 공지사항이 없어요.</p>
      </div>
      <div v-for="notice in notices" :key="notice.id">
        <button
          class="w-full px-5 py-5 flex items-center justify-between text-left active:bg-grey-3"
          @click="navigateTo(`/my/notices/${notice.id}`)"
        >
          <span class="text-body2 font-medium text-grey-10 flex-1 pr-3">{{ notice.title }}</span>
          <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6 shrink-0" />
        </button>
        <div class="mx-5 h-px bg-grey-4" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, NoticeListItem } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })

const { $api } = useNuxtApp()

const notices = ref<NoticeListItem[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NoticeListItem[]>>('/api/v1/notices')
    notices.value = res.data.data
  } catch {
    notices.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

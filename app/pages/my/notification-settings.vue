<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">알림 설정</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <span class="w-6 h-6 border-2 border-grey-5 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- 설정 목록 -->
    <div v-else class="flex-1 overflow-y-auto">

      <!-- 마케팅 정보 수신 동의 -->
      <div class="flex items-center justify-between px-5 h-[56px]">
        <span class="text-body2 font-normal text-grey-13">마케팅 정보 수신 동의</span>
        <button
          class="relative inline-flex items-center w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0"
          :class="marketingAgreed ? 'bg-primary' : 'bg-grey-5'"
          @click="toggleMarketing"
        >
          <span
            class="absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
            :class="marketingAgreed ? 'translate-x-[20px]' : 'translate-x-0'"
          />
        </button>
      </div>
      <div class="mx-5 h-px bg-grey-5" />

      <!-- 야간 푸시 알림 동의 -->
      <div class="flex items-center justify-between px-5 h-[56px]">
        <span class="text-body2 font-normal text-grey-13">야간 푸시 알림 동의</span>
        <button
          class="relative inline-flex items-center w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0"
          :class="nightPushConsent ? 'bg-primary' : 'bg-grey-5'"
          @click="toggleNightPush"
        >
          <span
            class="absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
            :class="nightPushConsent ? 'translate-x-[20px]' : 'translate-x-0'"
          />
        </button>
      </div>
      <div class="mx-5 h-px bg-grey-5" />

      <!-- 회고 작성 알림 동의 -->
      <div class="flex items-center justify-between px-5 h-[56px]">
        <span class="text-body2 font-normal text-grey-13">회고 작성 알림 동의</span>
        <button
          class="relative inline-flex items-center w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0"
          :class="enabled ? 'bg-primary' : 'bg-grey-5'"
          @click="toggleEnabled"
        >
          <span
            class="absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
            :class="enabled ? 'translate-x-[20px]' : 'translate-x-0'"
          />
        </button>
      </div>
      <div class="mx-5 h-px bg-grey-5" />

      <!-- 회고 알림 시간 -->
      <button class="w-full flex items-center justify-between px-5 pt-4 pb-4 gap-4 text-left">
        <div class="flex flex-col gap-[6px]">
          <span class="text-body2 font-normal text-grey-13">회고 알림 시간</span>
          <span class="text-label1 font-normal text-grey-7">설정한 시간에 회고 알림을 보내드립니다.</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span class="text-body2 font-normal text-grey-7">{{ reminderTimeLabel }}</span>
          <img src="/icons/chevron-right-sm.svg" alt="" class="w-4 h-4" />
        </div>
      </button>

    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, NotificationSetting } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const hideTabBar = useState('hideTabBar', () => false)
onMounted(() => { hideTabBar.value = true })
onUnmounted(() => { hideTabBar.value = false })

const { $api } = useNuxtApp()

const isLoading = ref(true)
const marketingAgreed = ref(false)
const nightPushConsent = ref(false)
const enabled = ref(false)
const reminderTime = ref<string | null>(null)

const reminderTimeLabel = computed(() => {
  if (!reminderTime.value) return '오후 8:00'
  const [h, m] = reminderTime.value.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
})

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NotificationSetting>>('/api/v1/notification-settings')
    marketingAgreed.value = res.data.data.marketingAgreed
    nightPushConsent.value = res.data.data.nightPushConsent
    enabled.value = res.data.data.enabled
    reminderTime.value = res.data.data.reminderTime
  } catch {
    // 오류 처리
  } finally {
    isLoading.value = false
  }
})

async function toggleMarketing() {
  marketingAgreed.value = !marketingAgreed.value
  try {
    await $api.put('/api/v1/notification-settings/marketing-consent', { agreed: marketingAgreed.value })
  } catch {
    marketingAgreed.value = !marketingAgreed.value
  }
}

async function toggleNightPush() {
  nightPushConsent.value = !nightPushConsent.value
  try {
    await $api.put('/api/v1/notification-settings/night-push-consent', { consent: nightPushConsent.value })
  } catch {
    nightPushConsent.value = !nightPushConsent.value
  }
}

async function toggleEnabled() {
  enabled.value = !enabled.value
  try {
    await $api.put('/api/v1/notification-settings', {
      enabled: enabled.value,
      reminderTime: reminderTime.value,
    })
  } catch {
    enabled.value = !enabled.value
  }
}
</script>

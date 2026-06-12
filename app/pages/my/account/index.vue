<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">계정 관리</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 이메일 영역 -->
    <div class="px-5 pt-6 pb-3 flex flex-col gap-2">
      <p class="text-body2 font-medium text-grey-10">이메일</p>
      <div class="h-[48px] px-4 rounded-xl bg-grey-3 flex items-center">
        <span class="text-body2 font-normal text-grey-7">{{ profile?.email ?? '' }}</span>
      </div>
      <p class="text-label1 font-normal text-grey-6">{{ loginMethodLabel }}</p>
    </div>

    <div class="mx-5 h-px bg-grey-4" />

    <!-- 로그아웃 -->
    <button
      class="w-full px-5 h-[56px] flex items-center justify-between text-left active:bg-grey-3"
      @click="showLogoutModal = true"
    >
      <span class="text-body2 font-normal text-grey-13">로그아웃</span>
      <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
    </button>

    <div class="mx-5 h-px bg-grey-4" />

    <!-- 회원탈퇴 -->
    <button
      class="w-full px-5 h-[56px] flex items-center justify-between text-left active:bg-grey-3"
      @click="navigateTo('/my/account/withdraw')"
    >
      <span class="text-body2 font-normal text-grey-13">회원탈퇴</span>
      <img src="/icons/chevron-right.svg" alt="" class="w-6 h-6" />
    </button>

    <div class="mx-5 h-px bg-grey-4" />

    <UiPopup
      v-model="showLogoutModal"
      title="정말 로그아웃 하시겠어요?"
      confirm-text="확인"
      @confirm="handleLogout"
    />

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, UserProfile } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const hideTabBar = useState('hideTabBar', () => false)
onMounted(() => { hideTabBar.value = true })
onUnmounted(() => { hideTabBar.value = false })

const { $api } = useNuxtApp()
const authStore = useAuthStore()

const profile = ref<UserProfile | null>(null)
const showLogoutModal = ref(false)

const loginMethodLabel = computed(() => {
  const p = profile.value?.provider
  if (p === 'GOOGLE') return 'Google로 가입한 계정이에요.'
  if (p === 'APPLE') return 'Apple로 가입한 계정이에요.'
  if (p === 'KAKAO') return 'Kakao로 가입한 계정이에요.'
  return ''
})

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    profile.value = res.data.data
  } catch { /* 오류 처리 */ }
})

async function handleLogout() {
  showLogoutModal.value = false
  authStore.logout()
  await navigateTo('/login')
}
</script>

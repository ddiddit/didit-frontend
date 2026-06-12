<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my/account')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">회원탈퇴</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 flex flex-col gap-6">

      <!-- 상단 안내 -->
      <div class="flex flex-col gap-1">
        <p class="text-heading2 font-bold text-grey-13">{{ nickname }}님,</p>
        <p class="text-heading2 font-bold text-grey-13">탈퇴하기 전에 반드시 확인해주세요.</p>
      </div>

      <!-- 경고 카드 -->
      <div class="bg-grey-3 rounded-2xl px-4 pt-5 pb-[14px] flex items-start gap-4">
        <div class="w-5 h-5 rounded-full bg-grey-6 flex items-center justify-center shrink-0 mt-[1px]">
          <span class="text-white text-[11px] font-bold leading-none">!</span>
        </div>
        <p class="text-label1 font-medium text-grey-9">탈퇴하면 계정 정보와 저장된 회고 데이터가 모두 삭제되며, 다시 복구할 수 없습니다.</p>
      </div>

      <!-- 탈퇴 사유 -->
      <div class="flex flex-col gap-[15px]">
        <p class="text-heading2 font-bold text-grey-13">탈퇴 사유를 알려주세요.</p>
        <div class="flex flex-col gap-[13px]">
          <div
            v-for="reason in reasons"
            :key="reason.value"
            class="flex items-center gap-3 cursor-pointer"
            @click="selectedReason = reason.value"
          >
            <UiCheckbox
              variant="radio"
              :model-value="selectedReason === reason.value"
              class="shrink-0 pointer-events-none"
            />
            <span class="text-body2 font-normal text-grey-10">{{ reason.label }}</span>
          </div>
        </div>
      </div>

      <!-- 동의 체크박스 -->
      <div class="flex items-center gap-2 cursor-pointer" @click="agreed = !agreed">
        <UiCheckbox
          :model-value="agreed"
          class="shrink-0 pointer-events-none"
        />
        <span class="text-body2 font-normal text-grey-10">안내사항을 모두 확인하였으며 탈퇴에 동의합니다.</span>
      </div>

    </div>

    <!-- 하단 버튼 -->
    <div class="px-5 pb-8 pt-3 flex gap-3 shrink-0">
      <button
        class="flex-1 h-[52px] rounded-xl border border-grey-4 text-body2 font-medium text-grey-9 active:bg-grey-3"
        @click="navigateTo('/my/account')"
      >취소</button>
      <button
        class="flex-1 h-[52px] rounded-xl text-body2 font-semibold transition-colors"
        :class="canSubmit ? 'bg-error text-white active:opacity-80' : 'bg-grey-3 text-grey-6'"
        :disabled="!canSubmit"
        @click="showConfirmModal = true"
      >탈퇴하기</button>
    </div>

    <!-- 탈퇴 확인 팝업 -->
    <UiPopup
      v-model="showConfirmModal"
      title="정말 탈퇴하시겠어요?"
      description="모든 데이터가 삭제되며 복구할 수 없어요."
      variant="destructive"
      confirm-text="탈퇴하기"
      :loading="isWithdrawing"
      @confirm="handleWithdraw"
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

const nickname = ref('')
const reasons = [
  { value: 'NO_NEED', label: '회고 기능이 필요 없어졌어요' },
  { value: 'MISSING_FEATURE', label: '기대했던 기능이 없어요' },
  { value: 'SERVICE_ISSUE', label: '서비스 오류나 불편한 점이 있어요' },
  { value: 'HARD_TO_USE', label: '사용 방법이 어렵거나 잘 모르겠어요' },
  { value: 'OTHER_SERVICE', label: '다른 서비스를 이용할 예정이에요' },
  { value: 'OTHER', label: '기타 (직접 입력)' },
]

const selectedReason = ref('')
const agreed = ref(false)
const showConfirmModal = ref(false)
const isWithdrawing = ref(false)

const canSubmit = computed(() => !!selectedReason.value && agreed.value)

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    nickname.value = res.data.data.nickname ?? ''
  } catch { /* 오류 처리 */ }
})

async function handleWithdraw() {
  if (!canSubmit.value || isWithdrawing.value) return
  isWithdrawing.value = true
  try {
    await $api.delete('/api/v1/users/me', { data: { reason: selectedReason.value } })
    authStore.logout()
    await navigateTo('/login')
  } catch { /* 오류 처리 */ } finally {
    isWithdrawing.value = false
    showConfirmModal.value = false
  }
}
</script>

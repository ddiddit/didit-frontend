<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">문의하기</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 탭 -->
    <div class="flex shrink-0 border-b border-grey-4">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 text-center pb-[10px] pt-3 text-body2 transition-colors relative"
        :class="activeTab === tab.key ? 'font-semibold text-grey-13' : 'font-normal text-grey-6'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-0 right-0 h-[2px] bg-grey-13 rounded-full"
        />
      </button>
    </div>

    <!-- 문의하기 탭 -->
    <div v-if="activeTab === 'form'" class="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 flex flex-col gap-5">
      <!-- 인트로 텍스트 -->
      <div class="flex flex-col gap-1">
        <p class="text-label1 font-semibold text-primary">디딧(didit)을 이용해주셔서 감사합니다!</p>
        <p class="text-heading2 font-bold text-grey-13">앱 사용 중 불편 사항이<br />있으신가요?<br />확인 후 신속히 도움을 드리겠습니다.</p>
      </div>

      <!-- 이메일 -->
      <div class="flex flex-col gap-2">
        <label class="text-body2 font-medium text-grey-10">이메일</label>
        <div class="h-[48px] px-4 rounded-xl bg-grey-3 flex items-center">
          <span class="text-body2 font-normal text-grey-7">{{ userEmail }}</span>
        </div>
      </div>

      <!-- 문의 유형 -->
      <div class="flex flex-col gap-3">
        <label class="text-body2 font-medium text-grey-10">문의 유형</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="px-4 h-[50px] rounded-xl border text-[15px] font-medium transition-colors bg-white"
            :class="category === cat.value
              ? 'border-grey-13 text-grey-13'
              : 'border-grey-5 text-grey-13'"
            @click="category = cat.value"
          >{{ cat.label }}</button>
        </div>
      </div>

      <!-- 문의 내용 -->
      <div class="flex flex-col gap-2">
        <label class="text-body2 font-medium text-grey-10">문의 내용</label>
        <textarea
          v-model="content"
          maxlength="500"
          placeholder="내용을 작성해 주세요."
          class="w-full h-[160px] px-4 py-3 rounded-xl bg-grey-3 text-body2 font-normal text-grey-10 placeholder:text-grey-5 focus:outline-none resize-none"
        />
      </div>

      <!-- 개인정보 동의 -->
      <div class="flex items-start gap-2 cursor-pointer" @click="privacyAgreed = !privacyAgreed">
        <UiCheckbox
          :model-value="privacyAgreed"
          class="shrink-0 mt-[1px] pointer-events-none"
        />
        <div class="flex flex-col gap-[2px]">
          <span class="text-label1 font-medium text-grey-10">[필수] 개인정보 수집 및 이용 동의</span>
          <span class="text-caption1 font-normal text-grey-6">문의 처리 및 답변 전달을 위해 이메일 정보 제공에 동의합니다.</span>
        </div>
      </div>
    </div>

    <!-- 문의내역 탭 -->
    <div v-else class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- 빈 상태 -->
      <div v-if="inquiries.length === 0" class="h-full flex flex-col items-center justify-center gap-2 px-5">
        <p class="text-body2 font-normal text-grey-6">아직 문의 내역이 없어요</p>
      </div>
      <!-- 아코디언 목록 -->
      <div v-else class="flex flex-col">
        <div v-for="inq in inquiries" :key="inq.id" class="border-b border-grey-4">
          <!-- 항목 헤더 -->
          <button
            class="w-full px-5 py-4 flex items-start justify-between text-left gap-3"
            @click="toggleInquiry(inq.id)"
          >
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-[2px] rounded text-caption1 font-medium"
                  :class="inq.answered ? 'bg-primary/10 text-primary' : 'bg-grey-3 text-grey-7'"
                >{{ inq.answered ? '답변완료' : '접수' }}</span>
                <span class="text-caption1 font-normal text-grey-6">{{ inq.createdAt }}</span>
              </div>
              <p class="text-body2 font-medium text-grey-13 truncate">{{ categoryLabel(inq.category) }}</p>
            </div>
            <img
              src="/icons/chevron-down.svg" alt=""
              class="w-5 h-5 shrink-0 mt-1 transition-transform duration-200"
              :class="expandedIds.has(inq.id) ? 'rotate-180' : ''"
            />
          </button>
          <!-- 펼쳐진 내용 -->
          <div v-if="expandedIds.has(inq.id)" class="px-5 pb-4 flex flex-col gap-3">
            <p class="text-body2 font-normal text-grey-9 whitespace-pre-wrap">{{ inq.content }}</p>
            <div v-if="inq.answer" class="bg-green-light rounded-xl p-4 flex flex-col gap-2">
              <p class="text-label1 font-semibold text-primary">다딧 담당자</p>
              <p class="text-body2 font-normal text-grey-9 whitespace-pre-wrap">{{ inq.answer }}</p>
            </div>
          </div>
        </div>
        <p class="text-center text-caption1 font-normal text-grey-6 py-4">최근 1년간 문의한 내역만 조회 가능합니다.</p>
      </div>
    </div>

    <!-- 문의하기 탭 하단 버튼 -->
    <div v-if="activeTab === 'form'" class="px-5 pb-8 pt-3 shrink-0">
      <UiButton :disabled="!canSubmit || isSubmitting" @click="handleSubmit">문의하기</UiButton>
    </div>

    <!-- 제출 완료 팝업 -->
    <UiPopup
      v-model="showSuccessModal"
      title="문의가 접수되었습니다."
      description="문의하신 내용에 차례로 답변드릴 예정이며 답변은 '문의내역'에서 확인하실 수 있습니다."
      :show-cancel="false"
      confirm-text="확인"
      :close-on-backdrop="false"
      @confirm="handleSuccessClose"
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

const userEmail = ref('')

const tabs = [
  { key: 'form', label: '문의하기' },
  { key: 'history', label: '문의내역' },
]
const activeTab = ref<'form' | 'history'>('form')

const categories = [
  { value: 'USAGE', label: '이용 문의' },
  { value: 'BUG', label: '오류 신고' },
  { value: 'IMPROVEMENT', label: '서비스 개선 제안' },
]

const category = ref('')
const content = ref('')
const privacyAgreed = ref(false)
const isSubmitting = ref(false)
const showSuccessModal = ref(false)

const canSubmit = computed(() => !!category.value && content.value.trim().length > 0 && privacyAgreed.value)

interface Inquiry {
  id: string
  category: string
  content: string
  answered: boolean
  answer?: string
  createdAt: string
}

const inquiries = ref<Inquiry[]>([])
const expandedIds = ref(new Set<string>())

function categoryLabel(val: string) {
  return categories.find(c => c.value === val)?.label ?? val
}

function toggleInquiry(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await $api.post('/api/v1/inquiries', {
      category: category.value,
      content: content.value.trim(),
    })
    showSuccessModal.value = true
  } catch {
    // 오류 처리
  } finally {
    isSubmitting.value = false
  }
}

function handleSuccessClose() {
  showSuccessModal.value = false
  category.value = ''
  content.value = ''
  privacyAgreed.value = false
  activeTab.value = 'history'
  loadInquiries()
}

async function loadInquiries() {
  try {
    const res = await $api.get<ApiResponse<Inquiry[]>>('/api/v1/inquiries')
    inquiries.value = res.data.data
  } catch {
    inquiries.value = []
  }
}

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<UserProfile>>('/api/v2/users/profile')
    userEmail.value = res.data.data.email ?? ''
  } catch { /* 오류 처리 */ }
  loadInquiries()
})
</script>

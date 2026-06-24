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
    <div class="flex shrink-0 border-b border-grey-5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 text-center pb-[10px] pt-3 text-[16px] font-semibold leading-[150%] tracking-[-0.02em] transition-colors relative"
        :class="activeTab === tab.key ? 'text-grey-13' : 'text-grey-7'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.key"
          class="absolute -bottom-px left-0 right-0 h-[2px] bg-grey-13"
        />
      </button>
    </div>

    <!-- 문의하기 탭 -->
    <div v-if="activeTab === 'form'" class="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-5 flex flex-col gap-6">
      <!-- 인트로 텍스트 -->
      <div class="flex flex-col gap-1">
        <p class="text-label1 font-semibold text-primary">디딧(didit)을 이용해주셔서 감사합니다!</p>
        <p class="text-heading2 font-semibold text-grey-13">앱 사용 중 불편 사항이 있으신가요?<br />확인 후 신속히 도움을 드리겠습니다.</p>
      </div>

      <!-- 이메일 -->
      <div class="flex flex-col gap-2">
        <label class="text-label1 font-medium text-grey-13">이메일</label>
        <div class="h-[56px] px-4 rounded-xl bg-grey-4 flex items-center">
          <span class="text-[15px] font-normal leading-[150%] tracking-[-0.02em] text-grey-6 no-underline [&_a]:!no-underline [&_a]:!text-grey-6">{{ userEmail }}</span>
        </div>
      </div>

      <!-- 문의 유형 -->
      <div class="flex flex-col gap-3">
        <label class="text-label1 font-medium text-grey-10">문의 유형</label>
        <div class="flex gap-3 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="px-4 h-[50px] rounded-xl border text-[15px] leading-[150%] tracking-[-0.02em] transition-colors"
            :class="category === cat.value
              ? 'bg-green-light border-primary text-grey-13 font-normal'
              : 'bg-white border-grey-5 text-grey-13 font-normal'"
            @click="category = cat.value"
          >{{ cat.label }}</button>
        </div>
      </div>

      <!-- 문의 내용 -->
      <div class="flex flex-col gap-2">
        <label class="text-label1 font-medium text-grey-10">문의 내용</label>
        <textarea
          ref="contentRef"
          v-model="content"
          maxlength="500"
          placeholder="내용을 작성해 주세요."
          class="w-full min-h-[124px] px-4 py-4 rounded-xl bg-grey-3 text-[15px] font-normal leading-[150%] tracking-[-0.02em] text-grey-10 placeholder:text-grey-7 focus:outline-none resize-none overflow-hidden"
          @input="autoResize"
        />
      </div>

      <!-- 개인정보 동의 -->
      <div class="flex items-start gap-2 cursor-pointer" @click="privacyAgreed = !privacyAgreed">
        <UiCheckbox
          :model-value="privacyAgreed"
          class="shrink-0 pointer-events-none"
        />
        <div class="flex flex-col gap-[2px]">
          <span class="text-label1 font-medium text-grey-8">[필수] 개인정보 수집 및 이용 동의</span>
          <span class="text-caption1 font-normal text-grey-7">문의 처리 및 답변 전달을 위해 이메일 정보 제공에 동의합니다.</span>
        </div>
      </div>
    </div>

    <!-- 문의내역 탭 -->
    <div v-else class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- 빈 상태 -->
      <div v-if="inquiries.length === 0" class="h-full flex flex-col items-center justify-center px-5">
        <p class="text-[14px] font-normal leading-[160%] tracking-[-0.02em] text-grey-9">문의하신 내역이 없어요.</p>
      </div>
      <!-- 아코디언 목록 -->
      <div v-else class="flex flex-col pt-1">
        <template v-for="inq in inquiries" :key="inq.id">
          <div :id="`inquiry-${inq.id}`">
            <!-- 항목 헤더 -->
            <button
              class="w-full px-5 py-5 flex items-center justify-between text-left gap-3"
              @click="toggleInquiry(inq.id)"
            >
              <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                <p class="text-[16px] font-medium leading-[150%] tracking-[-0.02em] text-grey-13 truncate">{{ categoryLabel(inq.category) }}</p>
                <div class="flex items-center gap-1.5">
                  <span
                    class="px-[5px] py-[3px] rounded text-[11px] font-medium leading-[130%] tracking-[-0.02em]"
                    :class="inq.answered ? 'bg-[#E2FAF0] text-[#37C58A]' : 'bg-grey-4 text-grey-7'"
                  >{{ inq.answered ? '답변완료' : '접수' }}</span>
                  <span class="text-[13px] font-medium tracking-[-0.02em] text-grey-7">{{ inq.createdAt }}</span>
                </div>
              </div>
              <img
                src="/icons/chevron-down-thin.svg" alt=""
                class="w-6 h-6 shrink-0 transition-transform duration-200"
                :class="expandedIds.has(inq.id) ? 'rotate-180' : ''"
              />
            </button>
            <!-- 펼쳐진 내용 -->
            <div v-if="expandedIds.has(inq.id)" class="px-5 pb-4 flex flex-col gap-3">
              <p class="text-[15px] font-normal leading-[160%] tracking-[-0.02em] text-grey-10 whitespace-pre-wrap">{{ inq.content }}</p>
              <button class="self-end text-[14px] font-medium tracking-[-0.02em] text-grey-7" @click.stop="deleteInquiry(inq.id)">삭제</button>
              <div v-if="inq.answer" class="bg-grey-3 rounded-2xl p-4 flex flex-col gap-2">
                <p class="text-[14px] font-semibold leading-[140%] tracking-[-0.02em] text-[#37C58A]">디딧 담당자</p>
                <p class="text-[15px] font-normal leading-[160%] tracking-[-0.02em] text-grey-10 whitespace-pre-wrap">{{ inq.answer }}</p>
              </div>
            </div>
          </div>
          <!-- 구분선 (좌우 20 인셋) -->
          <div class="mx-5 h-px bg-grey-5" />
        </template>
        <p class="text-center text-[13px] font-medium tracking-[-0.02em] text-grey-7 pt-9 pb-4">최근 1년간 문의한 내역만 조회 가능합니다.</p>
      </div>
    </div>

    <!-- 문의하기 탭 하단 버튼 -->
    <div v-if="activeTab === 'form'" class="px-5 pb-8 pt-3 shrink-0">
      <button
        class="w-full h-[60px] rounded-xl text-body2 font-semibold transition-colors"
        :class="(canSubmit && !isSubmitting) ? 'bg-primary text-grey-13 active:opacity-80' : 'bg-grey-5 text-grey-6'"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      >문의하기</button>
    </div>

    <!-- 제출 완료 팝업 -->
    <UiPopup
      v-model="showSuccessModal"
      title="문의가 접수되었습니다."
      :description="`문의하신 내용에 차례로 답변드릴 예정이며\n답변은 '문의내역'에서 확인하실 수 있습니다.`"
      :show-cancel="false"
      confirm-text="확인"
      :close-on-backdrop="false"
      @confirm="handleSuccessClose"
    />

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api'
import { parseServerDate } from '~/utils/date'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })


const { $api } = useNuxtApp()
const { load: loadProfile } = useProfile()

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
const contentRef = ref<HTMLTextAreaElement | null>(null)

// 입력 내용이 기본 영역을 넘으면 높이 자동 확장
function autoResize() {
  const el = contentRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(124, el.scrollHeight)}px`
}
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

// 문의 삭제
async function deleteInquiry(id: string) {
  try {
    await $api.delete(`/api/v1/inquiries/${id}`)
    inquiries.value = inquiries.value.filter(i => i.id !== id)
    expandedIds.value.delete(id)
  } catch { /* 오류 처리 */ }
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await $api.post('/api/v1/inquiries', {
      type: category.value,
      typeEtc: null,
      content: content.value.trim(),
      isAgreed: privacyAgreed.value,
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

// 백엔드 응답 형태
interface InquiryListItem {
  id: string
  type: string
  content: string
  status: 'PENDING' | 'ANSWERED'
  adminAnswer: string | null
  createdAt: string
}

// ISO 날짜 → YYYY.MM.DD
function formatDate(iso: string): string {
  const d = parseServerDate(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

async function loadInquiries() {
  try {
    const res = await $api.get<ApiResponse<InquiryListItem[]>>('/api/v1/inquiries')
    inquiries.value = res.data.data.map(i => ({
      id: i.id,
      category: i.type,
      content: i.content,
      answered: i.status === 'ANSWERED',
      answer: i.adminAnswer ?? undefined,
      createdAt: formatDate(i.createdAt),
    }))
  } catch {
    inquiries.value = []
  }
}

const route = useRoute()

// 문의 답변 알림에서 진입한 경우 가장 최근 답변된 문의를 펼치고 해당 위치로 스크롤한다.
function expandLatestAnswered() {
  const target = inquiries.value.find(i => i.answered)
  if (!target) return
  expandedIds.value.add(target.id)
  nextTick(() => {
    document.getElementById(`inquiry-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

onMounted(async () => {
  const fromNotification = route.query.from === 'notification'
  if (fromNotification) activeTab.value = 'history'

  const p = await loadProfile()
  userEmail.value = p?.email ?? ''

  await loadInquiries()

  if (fromNotification) expandLatestAnswered()
})
</script>

<template>
  <div class="h-full bg-background flex flex-col">

    <!-- 헤더: 검색 아이콘만 우측 -->
    <div
      class="flex items-center justify-end px-5 h-[50px] shrink-0"
      style="margin-top: max(54px, env(safe-area-inset-top, 54px));"
    >
      <button class="p-1" @click="goToSearch">
        <img src="/icons/search.svg" alt="검색" class="w-6 h-6" />
      </button>
    </div>

    <!-- 탭 선택: 리스트 / 캘린더 -->
    <div class="flex items-start gap-4 px-5 h-[55px] shrink-0">
      <button
        class="text-title3 transition-none"
        :class="activeTab === 'list' ? 'font-bold text-grey-12' : 'font-medium text-grey-6'"
        @click="activeTab = 'list'"
      >리스트</button>
      <button
        class="text-title3 transition-none"
        :class="activeTab === 'calendar' ? 'font-bold text-grey-12' : 'font-medium text-grey-6'"
        @click="activeTab = 'calendar'"
      >캘린더</button>
    </div>

    <!-- 리스트 탭 -->
    <template v-if="activeTab === 'list'">

      <!-- 빈 상태 -->
      <div
        v-if="!isLoading && retrospects.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-[6px]"
      >
        <img src="/icons/empty-retrospects.svg" alt="" class="w-[52px] h-[52px] mb-[6px]" />
        <p class="text-heading2 font-semibold text-grey-13">
          {{ keyword ? '검색 결과가 없어요' : '아직 기록된 회고가 없어요' }}
        </p>
        <p class="text-label1-reading font-normal text-grey-9 text-center">
          <template v-if="keyword">"{{ keyword }}"에 해당하는<br />회고를 찾을 수 없어요.</template>
          <template v-else>회고를 작성하면<br />이곳에 차곡차곡 쌓여요!</template>
        </p>
      </div>

      <!-- 목록 -->
      <div v-else-if="!isLoading" class="flex-1 overflow-y-auto scrollbar-hide">
        <ul>
          <li
            v-for="item in retrospects"
            :key="item.id"
            class="px-5 py-4 border-b border-grey-4"
            @click="navigateTo(`/retrospects/${item.id}`)"
          >
            <p class="text-caption1 font-normal text-grey-7 mb-1">{{ formatDate(item.completedAt ?? item.createdAt) }}</p>
            <p class="text-label1 font-semibold text-grey-13 leading-[1.4]">{{ item.title }}</p>
            <p v-if="item.summary" class="text-label2 font-normal text-grey-7 mt-1 line-clamp-2 leading-[1.5]">{{ item.summary }}</p>
          </li>
        </ul>
      </div>
    </template>

    <!-- 캘린더 탭 -->
    <template v-else>
      <div class="flex-1 overflow-y-auto scrollbar-hide px-5">
        <!-- 캘린더 카드 -->
        <div class="bg-white rounded-2xl py-5 px-[14px]">
          <!-- 월 네비게이션 -->
          <div class="flex items-center justify-center gap-2 mb-5">
            <button class="shrink-0 flex items-center" @click="prevMonth">
              <img src="/icons/chevron-left.svg" alt="이전 달" class="w-6 h-6 block" />
            </button>
            <span class="text-body3 font-semibold text-grey-13">{{ currentYear }}년 {{ currentMonth }}월</span>
            <button class="shrink-0 flex items-center" @click="nextMonth">
              <img src="/icons/chevron-right.svg" alt="다음 달" class="w-6 h-6 block" />
            </button>
          </div>

          <!-- 요일 헤더 -->
          <div class="grid grid-cols-7 mb-[14px]">
            <div
              v-for="day in weekdays"
              :key="day"
              class="h-[20px] flex items-center justify-center text-label2 font-medium text-grey-8"
            >{{ day }}</div>
          </div>

          <!-- 날짜 그리드 -->
          <div class="grid grid-cols-7 gap-y-4">
            <!-- 빈 셀 (월 시작 전) -->
            <div v-for="n in firstDayOfMonth" :key="`empty-${n}`" class="h-8" />
            <!-- 날짜 셀: 내부 32×32 원형 -->
            <button
              v-for="date in daysInMonth"
              :key="date"
              class="h-8 w-full flex items-center justify-center"
              @click="selectDate(date)"
            >
              <span
                class="w-8 h-8 flex items-center justify-center rounded-full text-label1 font-semibold transition-none"
                :class="getCellClass(date)"
              ><span class="translate-x-[0.3px] translate-y-[0.5px]">{{ date }}</span></span>
            </button>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, PaginatedResponse, Retrospective } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const route = useRoute()

// 페이지 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const retrospects = useState<Retrospective[]>('retrospects:list', () => [])
const activeTab = ref<'list' | 'calendar'>('list')
const isLoading = ref(retrospects.value.length === 0)

const keyword = computed(() => route.query.keyword as string | undefined)

watch(keyword, () => fetchRetrospects(), { immediate: true })

async function fetchRetrospects() {
  // 키워드 검색이거나 캐시가 없을 때만 로딩 표시
  if (keyword.value || retrospects.value.length === 0) isLoading.value = true
  try {
    const params = keyword.value
      ? `?keyword=${encodeURIComponent(keyword.value)}&page=0&size=50`
      : '?page=0&size=50'
    const res = await $api.get<ApiResponse<PaginatedResponse<Retrospective>>>(`/api/v1/retrospects${params}`)
    retrospects.value = res.data.data.data
  } catch {
    retrospects.value = []
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 캘린더 상태
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)
const selectedDate = ref<number | null>(null)

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

function isToday(date: number) {
  return (
    date === today.getDate() &&
    currentMonth.value === today.getMonth() + 1 &&
    currentYear.value === today.getFullYear()
  )
}

// 해당 날짜의 요일 반환 (0=일, 6=토)
function getDayOfWeek(date: number): number {
  return (firstDayOfMonth.value + date - 1) % 7
}

function getCellClass(date: number) {
  if (isToday(date)) return 'bg-green-light text-primary font-semibold'
  if (selectedDate.value === date) return 'bg-grey-11 text-grey-1 font-semibold'
  const dow = getDayOfWeek(date)
  if (dow === 0 || dow === 6) return 'text-grey-7 font-normal'
  return 'text-grey-13 font-normal'
}

function prevMonth() {
  selectedDate.value = null
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  selectedDate.value = null
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

function selectDate(date: number) {
  selectedDate.value = date
  // TODO: 날짜별 회고 조회
}

function goToSearch() {
  navigateTo('/retrospects/search')
}
</script>

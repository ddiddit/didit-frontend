<template>
  <div class="h-full bg-background flex flex-col">

    <!-- 헤더 -->
    <div class="relative flex items-center justify-end px-5 h-[50px] shrink-0">
      <div class="flex items-center gap-[10px]">
        <button @click="goToSearch">
          <img src="/icons/search.svg" alt="검색" class="w-7 h-7" />
        </button>
        <button @click="toggleMoreMenu">
          <img src="/icons/more-vertical.svg" alt="더보기" class="w-6 h-6" />
        </button>
      </div>

      <!-- 더보기 팝업 배경 -->
      <div v-if="showMoreMenu" class="fixed inset-0 z-[9]" @click="showMoreMenu = false" />

      <!-- 더보기 팝업 -->
      <div
        v-if="showMoreMenu"
        class="absolute top-[46px] right-5 bg-grey-1 border border-grey-4 rounded-xl z-10 overflow-hidden w-[180px] h-[55px] p-[6px] flex items-center"
        style="box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.08);"
      >
        <button
          class="w-full h-full flex items-center text-label1 font-medium text-grey-13 px-[6px]"
          @click="goToProjectEdit"
        >
          프로젝트 편집
        </button>
      </div>
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

    <!-- 프로젝트 필터 칩 -->
    <div class="flex items-center gap-[7px] px-5 pb-3 overflow-x-auto scrollbar-hide shrink-0">
      <button
        class="shrink-0 h-[34px] px-[11px] rounded-lg text-label1 font-semibold transition-none"
        :class="selectedProjectId === null ? 'bg-grey-13 text-grey-1' : 'bg-white text-grey-7'"
        @click="selectProject(null)"
      >ALL</button>
      <button
        v-for="project in projects"
        :key="project.id"
        class="shrink-0 h-[34px] px-[11px] rounded-lg text-label1 font-medium transition-none whitespace-nowrap"
        :class="selectedProjectId === project.id ? 'bg-grey-13 text-grey-1' : 'bg-white text-grey-7'"
        @click="selectProject(project.id)"
      >{{ project.name }}</button>

      <!-- 프로젝트 추가 버튼 -->
      <button
        class="shrink-0 h-[34px] px-[11px] rounded-lg text-label1 font-medium text-grey-7 bg-white transition-none whitespace-nowrap"
        @click="showAddProject = true"
      >+프로젝트 추가</button>
    </div>

    <!-- 프로젝트 추가 바텀시트 -->
    <Transition name="bottom-sheet">
      <div
        v-if="showAddProject"
        class="fixed inset-0 z-20 flex flex-col justify-end"
        @click.self="closeAddProject"
      >
        <div class="fixed inset-0 bg-black/40" @click="closeAddProject" />
        <div class="sheet-panel relative bg-white rounded-t-2xl px-5 pt-6 pb-10 z-10">
          <p class="text-heading2 font-semibold text-grey-13 mb-5">프로젝트 추가</p>
          <input
            v-model="newProjectName"
            type="text"
            maxlength="15"
            placeholder="프로젝트 이름 (최대 15자)"
            class="w-full h-[48px] px-4 rounded-xl border border-grey-4 bg-grey-1 text-label1 text-grey-13 placeholder:text-grey-6 outline-none focus:border-grey-8 transition-colors"
            @keyup.enter="submitAddProject"
          />
          <p class="text-right text-caption1 text-grey-6 mt-1">{{ newProjectName.length }}/15</p>
          <button
            class="w-full h-[50px] rounded-xl mt-4 text-label1 font-semibold transition-none"
            :class="newProjectName.trim().length > 0 ? 'bg-grey-13 text-white' : 'bg-grey-3 text-grey-6'"
            :disabled="newProjectName.trim().length === 0 || isSubmitting"
            @click="submitAddProject"
          >추가하기</button>
        </div>
      </div>
    </Transition>

    <!-- 리스트 탭 -->
    <template v-if="activeTab === 'list'">

      <!-- 빈 상태 -->
      <div
        v-if="!isLoading && retrospects.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-[6px]"
      >
        <img src="/icons/empty-retrospects.svg" alt="" class="w-[70px] h-[70px] mb-[6px]" />
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
import type { ApiResponse, Project, Retrospective } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const route = useRoute()

// 페이지 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const retrospects = useState<Retrospective[]>('retrospects:list', () => [])
const projects = useState<Project[]>('projects:list', () => [])
const activeTab = ref<'list' | 'calendar'>('list')
const isLoading = ref(retrospects.value.length === 0)
const selectedProjectId = ref<string | null>(null)
const showMoreMenu = ref(false)

const keyword = computed(() => route.query.keyword as string | undefined)

watch(keyword, () => fetchRetrospects(), { immediate: true })

onMounted(() => {
  if (projects.value.length === 0) fetchProjects()
})

async function fetchProjects() {
  try {
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
  } catch {
    projects.value = []
  }
}

async function fetchRetrospects() {
  if (keyword.value || retrospects.value.length === 0) isLoading.value = true
  try {
    let res
    if (selectedProjectId.value) {
      res = await $api.get<ApiResponse<Retrospective[]>>(`/api/v1/projects/${selectedProjectId.value}`)
    } else {
      const params = keyword.value ? `?keyword=${encodeURIComponent(keyword.value)}` : ''
      res = await $api.get<ApiResponse<Retrospective[]>>(`/api/v1/retrospectives${params}`)
    }
    retrospects.value = res.data.data
  } catch {
    retrospects.value = []
  } finally {
    isLoading.value = false
  }
}

async function selectProject(id: string | null) {
  selectedProjectId.value = id
  isLoading.value = true
  await fetchRetrospects()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function toggleMoreMenu() {
  showMoreMenu.value = !showMoreMenu.value
}

function goToProjectEdit() {
  showMoreMenu.value = false
  navigateTo('/projects')
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
}

function goToSearch() {
  navigateTo('/retrospects/search')
}
</script>

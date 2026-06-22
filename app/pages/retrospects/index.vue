<template>
  <div class="h-full bg-background flex flex-col relative">

    <!-- 헤더 -->
    <div class="relative flex items-center justify-end px-5 h-[50px] shrink-0">
      <div class="flex items-center gap-[10px]">
        <button @click="goToSearch">
          <img src="/icons/search.svg" alt="검색" class="w-6 h-6" />
        </button>
        <button v-if="activeTab === 'list'" @click="toggleMoreMenu">
          <img src="/icons/more-vertical.svg" alt="더보기" class="w-6 h-6" />
        </button>
      </div>

      <!-- 더보기 팝업 배경 -->
      <div v-if="showMoreMenu" class="absolute inset-0 z-[9]" @click="showMoreMenu = false" />

      <!-- 더보기 팝업 -->
      <div
        v-if="showMoreMenu"
        class="absolute top-[50px] right-5 bg-grey-1 border border-grey-4 rounded-[8px] z-10 overflow-hidden w-[180px] h-[55px] p-[6px] flex items-center"
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

    <!-- 헤더(검색·더보기)만 고정, 아래 전체(탭바·칩·콘텐츠)는 스크롤 -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide">

    <!-- 탭 선택: 리스트 / 캘린더 -->
    <div class="flex items-start gap-4 px-5 h-[55px]">
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

    <!-- 프로젝트 필터 칩 (리스트 탭에서만 노출, 스크롤 영역 포함) -->
    <div v-if="activeTab === 'list'" class="px-5 pb-3">
      <div class="relative flex items-center">
        <!-- 스크롤 가능한 칩 목록 -->
        <div
          ref="chipRowRef"
          class="flex items-center gap-[7px] overflow-x-auto scrollbar-hide w-full min-w-0 select-none"
          :style="{ touchAction: 'pan-x', paddingRight: chipsOverflow ? '44px' : '0' }"
          @mousedown="onChipDragStart"
          @mousemove="onChipDragMove"
          @mouseup="onChipDragEnd"
          @mouseleave="onChipDragEnd"
        >
          <button
            class="shrink-0 py-[8px] px-[11px] rounded-[8px] text-label1 font-semibold transition-colors duration-200 border"
            :class="selectedProjectId === null ? 'bg-grey-13 text-grey-1 border-transparent' : 'bg-white text-grey-7 border-grey-5'"
            @click.stop="!isChipDragging && selectProject(null)"
          >ALL</button>
          <button
            v-for="project in projects"
            :key="project.id"
            :data-project-id="project.id"
            class="shrink-0 py-[8px] px-[11px] rounded-[8px] text-label1 font-medium transition-none whitespace-nowrap border"
            :class="selectedProjectId === project.id ? 'bg-grey-13 text-grey-1 border-transparent' : 'bg-white text-grey-7 border-grey-5'"
            @click.stop="!isChipDragging && selectProject(project.id)"
          >{{ project.name }}</button>
          <button
            class="shrink-0 py-[8px] px-[11px] rounded-[8px] text-label1 font-medium text-grey-7 bg-white transition-none whitespace-nowrap border border-grey-5"
            @click.stop="!isChipDragging && navigateTo('/projects')"
          >+프로젝트 추가</button>
        </div>

        <!-- 칩 overflow 시에만 표시: 그라디언트 + 체브론 -->
        <template v-if="chipsOverflow">
          <div
            class="absolute right-0 top-0 bottom-0 w-[28px] pointer-events-none"
            style="background: linear-gradient(to right, rgba(246,246,246,0) 0%, #F6F6F6 55%);"
          />
          <button
            class="absolute right-0 top-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full flex items-center justify-center"
            style="background: #F1F1F1; border: 1.5px solid #E6E6E6;"
            @click="openProjectPicker"
          >
            <img src="/icons/chevron-down.svg" alt="" class="w-[18px] h-[18px]" />
          </button>
        </template>
      </div>
    </div>

    <!-- 프로젝트 픽커 팝업 (#app-container 기준 absolute) -->
    <Teleport to="#app-container">
      <Transition name="picker-fade">
        <div
          v-if="showProjectPicker"
          class="absolute inset-0 z-20 bg-black/40"
          @click="closeProjectPicker"
        />
      </Transition>
      <Transition name="picker-slide">
        <div
          v-if="showProjectPicker"
          class="absolute left-5 right-5 z-30"
          style="bottom: 30px;"
          @touchstart.passive="onDragStart"
          @touchend.passive="onDragEnd"
          @mousedown="onDragStart"
          @mouseup="onDragEnd"
          @click.stop
        >
          <div
            class="relative w-full bg-grey-1 rounded-[36px] overflow-hidden"
            style="padding: 32px 10px 20px;"
          >
            <!-- 드래그 핸들 -->
            <div class="absolute top-[14px] left-1/2 -translate-x-1/2 w-[50px] h-1 rounded-full bg-grey-5" />

            <!-- 타이틀 -->
            <h2 class="text-body2 font-semibold text-grey-13 text-center mb-6">모든 프로젝트</h2>

            <!-- 프로젝트 목록 -->
            <div class="flex flex-col max-h-[220px] overflow-y-auto scrollbar-hide">
              <button
                v-for="project in projects"
                :key="project.id"
                class="w-full rounded-[8px] flex items-center text-grey-13 transition-none text-left active:bg-grey-3"
                style="padding: 11px 14px; font-size: 15px; font-weight: 500; line-height: 150%; letter-spacing: -0.3px;"
                :class="selectedProjectId === project.id ? 'bg-grey-3' : ''"
                @click="selectProject(project.id, true); closeProjectPicker()"
              >{{ project.name }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 리스트 탭 -->
    <template v-if="activeTab === 'list'">

      <!-- 빈 상태 -->
      <div
        v-if="!isLoading && retrospects.length === 0"
        class="flex flex-col items-center justify-center gap-[6px] min-h-[55vh]"
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
      <div v-else-if="!isLoading">
        <ul class="flex flex-col px-5 py-3">
          <template v-for="group in groupedRetrospects" :key="group.label || 'this-week'">
            <!-- 주 단위 디바이더 (이번 주는 미표시) -->
            <li v-if="group.label" class="text-center text-label2 font-medium text-grey-7 py-3">{{ group.label }}</li>
            <li
              v-for="item in group.items"
              :key="item.id"
              class="bg-white rounded-2xl cursor-pointer mb-3"
              style="padding: 22px 22px 20px;"
              @click="navigateTo(`/retrospects/${item.id}`)"
            >
            <div class="flex flex-col gap-[14px]">
              <!-- 메인 콘텐츠 -->
              <div class="flex flex-col gap-2">
                <div class="flex flex-col gap-[2px]">
                  <!-- 프로젝트 + 날짜 -->
                  <div class="flex items-center gap-[5px]">
                    <template v-if="item.projectName">
                      <span class="text-caption1 font-medium text-grey-7">{{ item.projectName }}</span>
                      <span class="w-[3px] h-[3px] rounded-full bg-grey-5 shrink-0" />
                    </template>
                    <span class="text-caption1 font-medium text-grey-7">{{ formatDate(item.completedAt ?? item.createdAt) }}</span>
                  </div>
                  <!-- 제목 -->
                  <p class="text-body2 font-semibold text-grey-13">{{ item.title }}</p>
                </div>
                <!-- 요약 -->
                <p v-if="item.summary" class="text-label1 font-normal text-grey-10 leading-[1.6] line-clamp-2">{{ item.summary }}</p>
              </div>
              <!-- 태그 -->
              <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap gap-[6px]">
                <span
                  v-for="(tag, idx) in item.tags"
                  :key="tag.id"
                  class="text-[11px] font-semibold leading-[130%] tracking-[-0.02em] rounded-[6px]"
                  style="padding: 4px 6px;"
                  :style="{ backgroundColor: listTagColors[idx % listTagColors.length].bg, color: listTagColors[idx % listTagColors.length].text }"
                >#{{ tag.name }}</span>
              </div>
            </div>
            </li>
          </template>
        </ul>
      </div>
    </template>

    <!-- 캘린더 탭 -->
    <template v-else>
      <div class="px-5 pb-6">
        <!-- 캘린더 섹션 ↔ 날짜별 목록: gap-40 -->
        <div class="flex flex-col gap-[40px]">
          <div class="flex flex-col items-center gap-5 w-full">
            <!-- 주간 회고 메시지 (깃발 위 / 텍스트 아래, gap-8) -->
            <div class="flex flex-col items-center gap-2">
              <Icon name="material-symbols:flag-rounded" class="w-6 h-6 text-primary" />
              <span class="text-body1 font-semibold bg-gradient-to-r from-green-hover to-primary bg-clip-text text-transparent">
                {{ weeklyMessage }}
              </span>
            </div>

            <!-- 캘린더 카드: pt-22 pb-20, 내부 gap-20 -->
            <div class="bg-white rounded-2xl w-full flex flex-col items-center gap-5 pt-[22px] pb-5 overflow-clip">
              <!-- 월 네비게이션 -->
              <div class="flex items-center justify-center gap-2 w-full">
                <button class="shrink-0 flex items-center" @click="prevMonth">
                  <img src="/icons/chevron-left.svg" alt="이전 달" class="w-6 h-6 block" style="margin-bottom: 1px" />
                </button>
                <span class="text-body3 font-semibold text-grey-13">{{ currentYear }}년 {{ currentMonth }}월</span>
                <button class="shrink-0 flex items-center" @click="nextMonth">
                  <img src="/icons/chevron-right.svg" alt="다음 달" class="w-6 h-6 block" style="margin-bottom: 1px" />
                </button>
              </div>

              <!-- 요일 ↔ 날짜: gap-14 -->
              <div class="flex flex-col items-center gap-[14px]">
                <!-- 요일 헤더 -->
                <div class="flex items-center w-[322px]">
                  <div
                    v-for="day in weekdays"
                    :key="day"
                    class="flex-1 flex items-center justify-center text-label2 font-medium text-grey-8"
                  >{{ day }}</div>
                </div>

                <!-- 날짜 그리드 (w-322, 셀 w-46, 행간 16) -->
                <div class="flex flex-wrap items-start gap-y-4 w-[322px]">
                  <div v-for="n in firstDayOfMonth" :key="`empty-${n}`" class="w-[46px] h-[43px]" />
                  <button
                    v-for="date in daysInMonth"
                    :key="date"
                    class="w-[46px] flex flex-col items-center gap-[6px]"
                    @click="selectDate(date)"
                  >
                    <span
                      class="w-8 h-8 flex items-center justify-center rounded-full text-label1 transition-none"
                      :class="getCellClass(date)"
                    ><span class="translate-x-[0.3px] translate-y-[0.5px]">{{ date }}</span></span>
                    <span class="flex gap-[3px] h-[5px]">
                      <span v-for="i in dotCount(date)" :key="i" class="w-[5px] h-[5px] rounded-full bg-primary" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 선택한 날짜의 회고 목록 (gap-14) -->
          <div v-if="selectedDate" class="flex flex-col items-start gap-[14px] w-full">
            <p class="text-body2 font-semibold text-grey-9">
              {{ currentMonth }}월 {{ selectedDate }}일의 회고
            </p>
            <ul v-if="dailyRetrospects.length > 0" class="flex flex-col gap-3 w-full">
              <li
                v-for="r in dailyRetrospects"
                :key="r.id"
                class="bg-white rounded-2xl cursor-pointer w-full"
                style="padding: 22px 22px 20px;"
                @click="navigateTo(`/retrospects/${r.id}`)"
              >
                <div class="flex flex-col gap-2">
                  <div class="flex flex-col gap-[2px]">
                    <span v-if="r.completedAt" class="text-caption1 font-medium text-grey-7">{{ formatDate(r.completedAt) }}</span>
                    <p class="text-body2 font-semibold text-grey-13">{{ r.title }}</p>
                  </div>
                  <p v-if="r.summary" class="text-label1 font-normal text-grey-10 leading-[1.6] line-clamp-2">{{ r.summary }}</p>
                </div>
              </li>
            </ul>
            <p v-else-if="!dailyLoading" class="text-body3 text-grey-7 text-center w-full py-8">
              이 날 작성한 회고가 없어요.
            </p>
          </div>
        </div>
      </div>
    </template>

    </div>
    <!-- /헤더 아래 스크롤 영역 -->

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, CalendarResponse, DailyRetrospective, Project, Retrospective } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const route = useRoute()
const { track } = useAmplitude()

// 페이지 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const retrospects = useState<Retrospective[]>('retrospects:list', () => [])
const projects = useState<Project[]>('projects:list', () => [])
const activeTab = ref<'list' | 'calendar'>('list')
const isLoading = ref(retrospects.value.length === 0)
const selectedProjectId = ref<string | null>(null)
const showMoreMenu = ref(false)
const showProjectPicker = ref(false)

const keyword = computed(() => route.query.keyword as string | undefined)

const listTagColors = [
  { bg: '#E2FAF0', text: '#37C58A' },
  { bg: '#FAEBFA', text: '#E079E0' },
  { bg: '#E6EEFC', text: '#5A8DEE' },
  { bg: '#FDEDE7', text: '#F08A5D' },
  { bg: '#EEEBFD', text: '#8C7CF0' },
]

watch(keyword, () => fetchRetrospects(), { immediate: true })

// 주(월~일) 단위 날짜 디바이더로 그룹핑 (REC_003 기준, 이번 주 / 일주일 전 / N주 전)
const groupedRetrospects = computed(() => {
  const groups: { label: string; items: Retrospective[] }[] = []
  const startOfWeek = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // 월요일 시작
    return x.getTime()
  }
  const now = new Date()
  const thisWeek = startOfWeek(now)
  const nowMonths = now.getFullYear() * 12 + now.getMonth()
  for (const item of retrospects.value) {
    const date = new Date(item.completedAt ?? item.createdAt)
    const weeksAgo = Math.max(0, Math.round((thisWeek - startOfWeek(date)) / (7 * 86_400_000)))
    // 이번 주: 디바이더 없음 / ~4주: 주 단위 / 그 이후: 달 단위 / 12달 초과: 년 단위
    let label: string
    if (weeksAgo === 0) {
      label = ''
    } else if (weeksAgo <= 4) {
      label = weeksAgo === 1 ? '일주일 전' : `${weeksAgo}주 전`
    } else {
      const monthsAgo = Math.max(1, nowMonths - (date.getFullYear() * 12 + date.getMonth()))
      label = monthsAgo < 12 ? `${monthsAgo}달 전` : `${Math.floor(monthsAgo / 12)}년 전`
    }
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
})

const chipsOverflow = ref(false)

function updateChipOverflow() {
  if (chipRowRef.value) {
    chipsOverflow.value = chipRowRef.value.scrollWidth > chipRowRef.value.clientWidth
  }
}

watch(projects, () => nextTick(updateChipOverflow))

onMounted(() => {
  track('retrospect_list_viewed')
  if (projects.value.length === 0) fetchProjects()
  nextTick(updateChipOverflow)
  window.addEventListener('resize', updateChipOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateChipOverflow)
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

async function selectProject(id: string | null, fromPicker = false) {
  selectedProjectId.value = id
  isLoading.value = true

  // 픽커에서 선택 시 API 응답 전에 즉시 스크롤
  if (fromPicker && id !== null) {
    await nextTick()
    const container = chipRowRef.value
    const chipEl = container?.querySelector(`[data-project-id="${id}"]`) as HTMLElement | null
    if (container && chipEl) {
      scrollToChip(container, chipEl.offsetLeft - 8)
    }
  }

  await fetchRetrospects()
}

function scrollToChip(container: HTMLElement, targetLeft: number) {
  const startLeft = container.scrollLeft
  const distance = targetLeft - startLeft
  const duration = 550
  const startTime = performance.now()

  function easeInOutSine(t: number) {
    return -(Math.cos(Math.PI * t) - 1) / 2
  }

  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    container.scrollLeft = startLeft + distance * easeInOutSine(progress)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
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

// 캘린더 데이터 (회고 있는 날 dot + 주간 횟수 + 날짜별 목록)
const calendarDays = ref<Record<string, number>>({})
const weeklyCount = ref(0)
const weeklyGoalAchieved = ref(false)
const dailyRetrospects = ref<DailyRetrospective[]>([])
const dailyLoading = ref(false)

const pad = (n: number) => String(n).padStart(2, '0')
const dateKey = (date: number) => `${currentYear.value}-${pad(currentMonth.value)}-${pad(date)}`
const hasRetro = (date: number) => (calendarDays.value[dateKey(date)] ?? 0) > 0
const weeklyMessage = computed(() =>
  weeklyGoalAchieved.value ? '이번 주 3회 이상 회고 완료!' : `이번 주 ${weeklyCount.value}회 회고`,
)

async function fetchCalendar() {
  try {
    const res = await $api.get<ApiResponse<CalendarResponse>>('/api/v1/retrospectives/calendar', {
      params: { year: currentYear.value, month: currentMonth.value },
    })
    const data = res.data.data
    const map: Record<string, number> = {}
    for (const d of data.days) map[d.date] = d.count
    calendarDays.value = map
    weeklyCount.value = data.weeklyCount
    weeklyGoalAchieved.value = data.isWeeklyGoalAchieved
  } catch {
    calendarDays.value = {}
    weeklyCount.value = 0
    weeklyGoalAchieved.value = false
  }
}

async function fetchDaily(date: number) {
  dailyLoading.value = true
  try {
    const res = await $api.get<ApiResponse<DailyRetrospective[]>>(
      '/api/v1/retrospectives/calendar/daily',
      { params: { date: dateKey(date) } },
    )
    dailyRetrospects.value = res.data.data
  } catch {
    dailyRetrospects.value = []
  } finally {
    dailyLoading.value = false
  }
}

// 캘린더 탭 진입 / 월 변경 시 캘린더 데이터 로드 + 오늘 날짜 회고 자동 노출
watch(activeTab, (t) => {
  if (t !== 'calendar') return
  fetchCalendar()
  const onTodayMonth =
    currentYear.value === today.getFullYear() && currentMonth.value === today.getMonth() + 1
  if (selectedDate.value === null && onTodayMonth) selectDate(today.getDate())
})
watch([currentYear, currentMonth], () => {
  if (activeTab.value === 'calendar') fetchCalendar()
})

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
  if (isToday(date)) return 'bg-green-light-active text-primary font-semibold'
  if (selectedDate.value === date) return 'bg-grey-11 text-grey-1 font-semibold'
  const dow = getDayOfWeek(date)
  if (dow === 0 || dow === 6) return 'text-grey-7 font-medium'
  return 'text-grey-13 font-medium'
}

const dotCount = (date: number) => Math.min(calendarDays.value[dateKey(date)] ?? 0, 3)

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
  fetchDaily(date)
}

function goToSearch() {
  navigateTo('/retrospects/search')
}

// 프로젝트 픽커 팝업 제어
const dragStartY = ref(0)

function openProjectPicker() {
  showProjectPicker.value = true
}

function closeProjectPicker() {
  showProjectPicker.value = false
}

function onDragStart(e: TouchEvent | MouseEvent) {
  dragStartY.value = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
}

function onDragEnd(e: TouchEvent | MouseEvent) {
  const endY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY
  if (endY - dragStartY.value > 60) closeProjectPicker()
}

// 칩 목록 마우스 드래그 스크롤
const chipRowRef = ref<HTMLElement | null>(null)
const isChipDragging = ref(false)
const chipDragStartX = ref(0)
const chipScrollStartLeft = ref(0)

function onChipDragStart(e: MouseEvent) {
  isChipDragging.value = false
  chipDragStartX.value = e.clientX
  chipScrollStartLeft.value = chipRowRef.value?.scrollLeft ?? 0
  ;(e.currentTarget as HTMLElement).style.cursor = 'grabbing'
}

function onChipDragMove(e: MouseEvent) {
  if (!(e.buttons & 1)) return
  const dx = e.clientX - chipDragStartX.value
  if (Math.abs(dx) > 4) isChipDragging.value = true
  if (chipRowRef.value) chipRowRef.value.scrollLeft = chipScrollStartLeft.value - dx
}

function onChipDragEnd(e: MouseEvent) {
  ;(e.currentTarget as HTMLElement).style.cursor = ''
  setTimeout(() => { isChipDragging.value = false }, 0)
}

</script>

<style scoped>
.picker-fade-enter-active { transition: opacity 0.25s ease; }
.picker-fade-leave-active { transition: opacity 0.2s ease; }
.picker-fade-enter-from,
.picker-fade-leave-to    { opacity: 0; }

.picker-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease; }
.picker-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.22s ease; }
.picker-slide-enter-from,
.picker-slide-leave-to    { transform: translateY(120%); opacity: 0; }
</style>

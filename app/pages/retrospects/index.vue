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

    <!-- 프로젝트 필터 칩 (리스트 탭에서만 노출) -->
    <div v-if="activeTab === 'list'" class="px-5 pb-3 shrink-0">
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
        <ul class="flex flex-col gap-3 px-5 py-3">
          <li
            v-for="item in retrospects"
            :key="item.id"
            class="bg-white rounded-2xl cursor-pointer"
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

<template>
  <div class="h-full bg-background flex flex-col relative">

    <!-- 미션 완료(레벨업) 팝업 -->
    <Teleport to="#app-container">
      <div v-if="showLevelUpPopup && mission" class="absolute inset-0 z-[55] flex items-center justify-center px-5">
        <div class="absolute inset-0 bg-black/40" />
        <HomeMissionPopup
          :level="mission.currentLevel"
          :message="levelUpMessage"
          :loading="popupConfirming"
          class="relative"
          @confirm="confirmLevelUp"
        />
      </div>
    </Teleport>

    <!-- 미션 실패 팝업 -->
    <Teleport to="#app-container">
      <div v-if="showFailurePopup && mission" class="absolute inset-0 z-[55] flex items-center justify-center px-5">
        <div class="absolute inset-0 bg-black/40" />
        <HomeMissionFailurePopup
          :message="failureMessage"
          :loading="popupConfirming"
          class="relative"
          @retry="retryMission"
        />
      </div>
    </Teleport>

    <!-- 헤더: H:50, 벨 아이콘만 우측 (빈 화면에서만 고정 노출 — 로딩 중엔 숨김) -->
    <header
      v-if="!isLoading && recentRetrospectives.length === 0"
      class="flex items-center justify-end px-5 h-[50px] shrink-0"
    >
      <button @click="goToNotifications">
        <img
          :src="hasUnread ? '/icons/bell-on.svg' : '/icons/bell-off.svg'"
          alt="알림"
          class="w-6 h-6"
        />
      </button>
    </header>

    <!-- 로드 실패: 헤더 아래~탭바 위를 덮는 전체 화면 에러 -->
    <UiErrorState
      v-if="loadError"
      :variant="loadError"
      class="absolute inset-x-0 bottom-0 top-[50px] bg-background"
      @action="loadError === 'network' ? loadHome() : navigateTo('/my/inquiry')"
    />

    <!-- 인사말 (로딩/빈 상태에서만 고정; 회고 있으면 아래 스크롤 영역 안에 포함) -->
    <div v-if="isLoading || recentRetrospectives.length === 0" class="px-5 shrink-0">
      <template v-if="isLoading">
        <span class="inline-block w-24 h-6 bg-grey-4 rounded animate-pulse mb-1 block" />
        <span class="inline-block w-52 h-6 bg-grey-4 rounded animate-pulse block" />
      </template>
      <h1 v-else class="text-title3 font-semibold text-grey-13 leading-[1.4]">
        {{ nickname }}님,<br />
        {{ greetingMessage }}
      </h1>
    </div>

    <!-- 빈 상태: 세로 중앙 정렬 -->
    <div
      v-if="!isLoading && recentRetrospectives.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-[40px] pb-16"
    >
      <!-- 아이콘 + 텍스트 그룹 -->
      <div class="flex flex-col items-center gap-3">
        <img src="/icons/empty-home.svg" alt="" class="w-[70px] h-[70px] rounded-[12px]" />
        <div class="flex flex-col items-center gap-[6px]">
          <p class="text-heading2 font-semibold text-grey-13">아직 작성한 회고가 없어요</p>
          <p class="text-label1-reading font-normal text-grey-9 text-center">
            회고를 시작하고<br />오늘의 일을 기록해 보세요!
          </p>
        </div>
      </div>

      <!-- 회고 시작하기 버튼 -->
      <button
        class="flex items-center gap-1 pl-[12px] pr-[18px] py-[9px] bg-primary rounded-xl"
        @click="startRetrospect"
      >
        <img src="/icons/add.svg" alt="" class="w-6 h-6" />
        <span class="text-body2 font-semibold text-grey-13">회고 시작하기</span>
      </button>
    </div>

    <!-- 회고 있음: 인사말 + 피드백 슬라이더 + 나의 최근 회고 (전체 스크롤) -->
    <div
      v-else-if="!isLoading && recentRetrospectives.length > 0"
      class="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-24"
    >
      <!-- 헤더: 알림벨 (콘텐츠와 함께 스크롤) -->
      <header class="flex items-center justify-end px-5 h-[50px]">
        <button @click="goToNotifications">
          <img
            :src="hasUnread ? '/icons/bell-on.svg' : '/icons/bell-off.svg'"
            alt="알림"
            class="w-6 h-6"
          />
        </button>
      </header>

      <!-- 인사말 (스크롤 영역 포함) -->
      <h1 class="px-5 text-title3 font-semibold text-grey-13 leading-[1.4]">
        {{ nickname }}님,<br />
        {{ greetingMessage }}
      </h1>

      <!-- 미션/레벨 카드 — 비면 첫 회고(Lv.1 달성) 기본 카드 -->
      <HomeMissionCard
        :data="displayMission"
        :first-mission="displayMission.currentLevel === 0"
        class="mt-5 mx-5"
        @start="startRetrospect"
      />

      <!-- 최근 제안 받은 행동 (단일 카드 + 구분선) — Figma 새 홈 UI: 날짜·제목·프로젝트·태그 -->
      <div v-if="recentList.length > 0" class="mt-8 px-5">
        <p class="text-[16px] font-semibold text-grey-10 leading-[1.5] tracking-[-0.02em]">최근 제안 받은 행동</p>
        <p class="text-[14px] font-medium text-grey-7 leading-[1.4] tracking-[-0.02em] mt-[3px]">제안 받은 피드백을 업무에 적용해보세요</p>
        <div class="mt-3.5 bg-white rounded-[18px] px-5 py-[22px] flex flex-col gap-[14px]">
          <template v-for="(r, i) in recentList" :key="r.id">
            <button class="flex items-center gap-3 text-left w-full" @click="navigateTo(`/retrospects/${r.id}`)">
              <div class="shrink-0 w-[42px] h-[42px] rounded-[10px] bg-grey-4 flex items-center justify-center">
                <span class="text-[12px] font-semibold text-grey-7 leading-[1.36]">{{ r.completedAt ? formatDate(r.completedAt) : '' }}</span>
              </div>
              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <!-- 상단: 피드백 (최대 2줄) -->
                <p class="text-[15px] font-medium text-grey-13 leading-[1.5] tracking-[-0.02em] line-clamp-2">{{ r.summary || r.title }}</p>
                <!-- 하단: 프로젝트명 · 회고제목 (자유회고는 제목만) -->
                <div class="flex items-center gap-[5px]">
                  <template v-if="r.projectName">
                    <span class="text-[12px] font-medium text-green-hover leading-[1.36] tracking-[-0.02em] shrink-0">{{ r.projectName }}</span>
                    <span class="w-[3px] h-[3px] rounded-full bg-grey-5 shrink-0" />
                  </template>
                  <span class="text-[12px] font-medium text-grey-7 leading-[1.36] tracking-[-0.02em] truncate">{{ r.title }}</span>
                </div>
              </div>
            </button>
            <div v-if="i < recentList.length - 1" class="h-px bg-grey-3" />
          </template>
        </div>
      </div>
    </div>

    <!-- FAB + 툴팁: 회고 있을 때만 표시 -->
    <div
      v-if="!isLoading && recentRetrospectives.length > 0"
      class="absolute right-5 flex items-center gap-[14px]"
      style="bottom: 16px;"
    >
      <!-- 툴팁 버블 (figma: bg #3C3C3C, padding 9/14, radius 8, 흰 텍스트) -->
      <div
        class="relative flex items-center px-[14px] py-[9px] rounded-lg bg-grey-10"
        style="box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
      >
        <span v-if="!isCompleted" class="text-label1 font-medium text-grey-1 whitespace-nowrap">
          오늘 남은 회고 횟수&nbsp;<span class="text-label1 font-semibold text-primary">{{ remaining }}</span><span class="text-label1 font-medium text-grey-7">/{{ maxDaily }}</span>
        </span>
        <span v-else class="text-label1 font-medium text-grey-1 whitespace-nowrap">
          오늘 회고 {{ maxDaily }}회 완료
        </span>
        <!-- 오른쪽 꼬리: 피그마 Polygon 1.svg -->
        <svg
          class="absolute -right-[8px] top-1/2 -translate-y-1/2"
          width="13" height="16" viewBox="0 0 12 12" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0328 3.87689C11.4819 4.62057 11.4819 6.69193 10.0328 7.43561L2.91317 11.0894C1.58225 11.7724 1.56809e-07 10.806 1.3897e-07 9.31005L5.18278e-08 2.00244C3.39887e-08 0.506487 1.58224 -0.459945 2.91317 0.223086L10.0328 3.87689Z"
            fill="#3C3C3C"
          />
        </svg>
      </div>

      <!-- FAB -->
      <button
        class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        :class="isCompleted ? 'bg-grey-5 cursor-not-allowed' : 'bg-primary'"
        :disabled="isCompleted"
        @click="startRetrospect"
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.75 16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75V16.25Z"
            :fill="isCompleted ? '#989898' : '#191919'"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, HomeResponse, CurrentMissionResponse } from '~/types/api'
import { getTagColor } from '~/utils/tag-color'
import { parseServerDate } from '~/utils/date'
import { toErrorVariant, isAuthError } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const { track } = useAmplitude()

// 닉네임은 홈 응답(/api/v2/home)에서 사용 — 백엔드가 홈 1콜로 nickname·mission까지 반환
const nickname = useState<string>('home:nickname', () => '')

// 페이지 이동 후 재방문 시 깜빡임 없도록 SPA 전체에서 상태 유지
const recentRetrospectives = useState<HomeResponse['recentRetrospectives']>('home:retrospectives', () => [])
const todayRetrospectiveCount = useState<number>('home:todayCount', () => 0)
const mission = useState<CurrentMissionResponse | null>('home:mission', () => null)
// 백엔드가 미션을 비워 줄 때(레벨 0 등) 보여줄 기본 미션 — 첫 회고 작성하기(= Lv.1 달성 미션)
const FIRST_MISSION: CurrentMissionResponse = {
  currentLevel: 0,
  mission: {
    type: 'FIRST_RETRO',
    title: '첫 회고 작성하기',
    description: '첫 회고를 작성해보세요',
    progress: 0,
    target: 1,
    remainingDays: null,
    cta: '회고 남기기',
  },
  weeklyStatus: null,
  popup: { exists: false, type: null },
}
// 미션이 비어 있으면 기본(첫 회고) 카드로 대체 — 카드가 항상 레벨에 맞게 뜨도록
const displayMission = computed<CurrentMissionResponse>(() =>
  mission.value?.mission ? mission.value : FIRST_MISSION,
)
// 알림 미읽음 여부는 알림 페이지와 상태를 공유 (읽음 처리 시 벨 아이콘 즉시 갱신)
const hasUnread = useState<boolean>('notifications:hasUnread', () => false)

// 캐시된 데이터가 있으면 로딩 스켈레톤 생략
const homeLoaded = useState<boolean>('home:loaded', () => false)
const isLoading = ref(!homeLoaded.value)

const maxDaily = 3
const remaining = computed(() => Math.max(0, maxDaily - todayRetrospectiveCount.value))
const isCompleted = computed(() => remaining.value === 0)

const greetingMessage = computed(() =>
  recentRetrospectives.value.length === 0 ? '첫 회고를 시작해볼까요?' : '오늘 어떤 일을 하셨나요?',
)

function formatDate(dateStr: string): string {
  const d = parseServerDate(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 최근 회고 최대 3개 — 피드백 슬라이더(요약 있는 것)와 최근 회고 리스트에 사용
const topFeedbacks = computed(() => recentRetrospectives.value.filter((r) => r.summary).slice(0, 3))
const recentList = computed(() => recentRetrospectives.value.slice(0, 5))

// 피드백 캐러셀 (transform 방식 — 모든 카드 좌측 정렬 + 우측 peek, 마우스/터치 드래그)
const STEP = 352 // 카드 w-340 + gap-3(12)
const activeFeedback = ref(0)
const dragOffset = ref(0)
const dragging = ref(false)
const wasDrag = ref(false) // 드래그였으면 카드 클릭(이동) 방지
let startX = 0

const trackStyle = computed(() => ({
  transform: `translateX(${-activeFeedback.value * STEP + dragOffset.value}px)`,
  transition: dragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
}))

function pointerX(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
}
function onSliderDown(e: MouseEvent | TouchEvent) {
  dragging.value = true
  wasDrag.value = false
  startX = pointerX(e)
  dragOffset.value = 0
}
function onSliderMove(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return
  if ('buttons' in e && !(e.buttons & 1)) return
  const dx = pointerX(e) - startX
  if (Math.abs(dx) > 5) wasDrag.value = true
  dragOffset.value = dx
}
function onSliderUp() {
  if (!dragging.value) return
  dragging.value = false
  const moved = dragOffset.value
  dragOffset.value = 0
  const max = topFeedbacks.value.length - 1
  if (moved < -60 && activeFeedback.value < max) activeFeedback.value++
  else if (moved > 60 && activeFeedback.value > 0) activeFeedback.value--
  setTimeout(() => {
    wasDrag.value = false
  }, 0)
}
function goFeedback(i: number) {
  activeFeedback.value = i
}

// 로드 실패 시 보여줄 전체 화면 에러 (네트워크 끊김 / 서버 오류 / 알 수 없는 오류)
const loadError = ref<'network' | 'server' | 'generic' | null>(null)

async function loadHome() {
  loadError.value = null
  isLoading.value = !homeLoaded.value
  try {
    // /api/v2/home 한 번이면 nickname·mission·알림까지 전부 받음
    const { data } = await $api.get<ApiResponse<HomeResponse>>('/api/v2/home')
    const home = data.data
    nickname.value = home.nickname
    recentRetrospectives.value = home.recentRetrospectives
    todayRetrospectiveCount.value = home.todayRetrospectiveCount
    hasUnread.value = home.hasUnreadNotification
    mission.value = home.mission
    evaluateMissionPopup()
    homeLoaded.value = true
  } catch (e) {
    // 인증 만료는 인터셉터가 로그인으로 보냄 → 에러 화면 X
    if (isAuthError(e)) return
    // 그 외엔 캐시가 없을 때만 에러 화면 노출
    if (!homeLoaded.value) loadError.value = toErrorVariant(e)
  } finally {
    isLoading.value = false
  }
}

// ── 미션 완료(레벨업) 팝업 ─────────────────────────────
const showLevelUpPopup = ref(false)
const showFailurePopup = ref(false)
const popupConfirming = ref(false)
// 배지 획득 팝업과 조율 (배지 먼저 → 닫히면 미션 레벨업 팝업)
const { badge: acquiredBadge } = useBadgeAcquired()
const missionPopupPending = ref(false)

// 레벨업 축하 메시지 (백엔드 PopupStatus에 문구가 없어 프론트에서 매핑)
const LEVEL_UP_MESSAGES: Record<number, string> = {
  2: '한 주 동안 꾸준히 회고를 작성했네요.\n작은 기록이 좋은 습관의 시작이 될 수 있어요.',
  3: '꾸준히 기록하는 습관이 만들어졌네요.\n다음 회고도 차근차근 이어가 보세요.',
  4: '3번의 회고를 작성했어요.\n계속해서 나만의 회고 루틴을 이어가 보세요.',
  5: '꾸준히 기록하는 습관이 만들어졌네요.\n다음 회고도 차근차근 이어가 보세요.',
  6: '5번의 회고를 작성했어요.\n기록하는 습관이 조금씩 자리를 잡고 있어요.',
  7: '꾸준히 기록하는 습관이 만들어졌네요.\n다음 회고도 차근차근 이어가 보세요.',
  8: '7번의 회고를 작성했어요.\n꾸준히 쌓아온 기록이 성장의 기반이 돼요.',
  9: '꾸준히 기록하는 습관이 만들어졌네요.\n다음 회고도 차근차근 이어가 보세요.',
  10: '10번의 회고를 작성하고 최고 레벨에 도달했어요.\n앞으로도 꾸준히 회고를 남겨보세요!',
}
const levelUpMessage = computed(() => LEVEL_UP_MESSAGES[mission.value?.currentLevel ?? 0] ?? '미션을 완료했어요!')

// 백엔드 getPopupStatus 미러: 미확인 레벨업이면 완료 팝업 노출
// (Lv.1 첫 미션은 levelUpPopupShown=true로 생성돼 안 뜸)
function evaluateMissionPopup() {
  const m = mission.value
  if (!m) {
    showLevelUpPopup.value = false
    showFailurePopup.value = false
    missionPopupPending.value = false
    return
  }
  // 1) 레벨업(완료) 우선 — popup.type === 'LEVEL_UP' (왕관 이미지는 Lv.2부터)
  if (m.popup.exists && m.popup.type === 'LEVEL_UP' && m.currentLevel >= 2) {
    showFailurePopup.value = false
    // 배지 획득 팝업이 떠 있으면 닫힐 때까지 대기 (겹침 방지)
    if (acquiredBadge.value) {
      missionPopupPending.value = true
      showLevelUpPopup.value = false
      return
    }
    showLevelUpPopup.value = true
    return
  }
  // 2) 미션 실패
  if (m.popup.exists && m.popup.type === 'FAILURE') {
    showLevelUpPopup.value = false
    showFailurePopup.value = true
    return
  }
  showLevelUpPopup.value = false
  showFailurePopup.value = false
  missionPopupPending.value = false
}

// 대기 중이던 미션 팝업: 배지 팝업이 닫히면 그때 노출
watch(acquiredBadge, (b) => {
  if (!b && missionPopupPending.value) {
    missionPopupPending.value = false
    showLevelUpPopup.value = true
  }
})

async function confirmLevelUp() {
  if (popupConfirming.value) return
  popupConfirming.value = true
  try {
    await $api.post('/api/v1/missions/level-up/confirm')
    const { data } = await $api.get<ApiResponse<CurrentMissionResponse>>('/api/v1/missions/current')
    mission.value = data.data
  } catch { /* 실패해도 팝업은 닫아 사용자를 막지 않음 */ }
  showLevelUpPopup.value = false
  popupConfirming.value = false
  evaluateMissionPopup() // 연속 레벨업이면 다음 완료 팝업 이어서 노출
}

// 미션 실패 메시지 (백엔드 미제공 → 프론트 매핑). 실패는 기한제/연속주만 발생
const failureMessage = computed(() => {
  const m = mission.value?.mission
  if (!m) return ''
  if (m.type === 'CONSECUTIVE_WEEK') {
    return `이번 주에 회고를 작성하지 않아\n연속 기록이 초기화되었어요.\n다시 ${m.target}주 연속 회고에 도전해보세요.`
  }
  return `일주일 내에 회고 ${m.target}회를 완료하지 못했어요.\n다시 도전해볼까요?`
})

async function retryMission() {
  if (popupConfirming.value) return
  popupConfirming.value = true
  try {
    await $api.post('/api/v1/missions/retry')
    const { data } = await $api.get<ApiResponse<CurrentMissionResponse>>('/api/v1/missions/current')
    mission.value = data.data
  } catch { /* 실패해도 팝업은 닫음 */ }
  showFailurePopup.value = false
  popupConfirming.value = false
  evaluateMissionPopup()
}

onMounted(() => {
  track('home_viewed')
  loadHome()
})

function goToNotifications() {
  navigateTo('/notifications')
}

function startRetrospect() {
  track('retrospect_started', { source: 'home' })
  navigateTo('/retrospect/start')
}
</script>

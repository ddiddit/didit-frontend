<template>
  <div class="h-full bg-background flex flex-col relative overflow-hidden">
    <!-- 더미 홈 콘텐츠 (딤·블러 효과 확인용 배경) -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-24 pointer-events-none">
      <header class="flex items-center justify-end px-5 h-[50px]">
        <img src="/icons/bell-off.svg" alt="" class="w-6 h-6" />
      </header>
      <h1 class="px-5 text-title3 font-semibold text-grey-13 leading-[1.4]">
        디딧님,<br />오늘 어떤 일을 하셨나요?
      </h1>
      <div class="mt-8 px-5">
        <p class="text-[16px] font-semibold text-grey-10">최근 제안 받은 행동</p>
        <div class="mt-3.5 bg-white rounded-[18px] px-5 py-[22px] flex flex-col gap-[14px]">
          <p class="text-[15px] font-medium text-grey-13">온보딩 개선 효과를 데이터로 검증해보기</p>
          <div class="h-px bg-grey-3" />
          <p class="text-[15px] font-medium text-grey-13">핵심 가설을 사용자 인터뷰로 확인해보기</p>
        </div>
      </div>
    </div>

    <!-- 프리뷰 컨트롤 -->
    <div class="absolute top-2 inset-x-0 z-[60] flex flex-col gap-2 px-3">
      <div class="flex gap-2 justify-center">
        <button class="px-3 py-1.5 rounded-lg bg-grey-13 text-grey-1 text-label2 font-semibold" @click="popup = 'levelup'">완료 팝업</button>
        <button class="px-3 py-1.5 rounded-lg bg-grey-13 text-grey-1 text-label2 font-semibold" @click="popup = 'failure'">실패 팝업</button>
        <button class="px-3 py-1.5 rounded-lg bg-grey-5 text-grey-13 text-label2 font-semibold" @click="closeAll">닫기</button>
      </div>
      <!-- 배지별 획득 팝업 -->
      <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          v-for="b in BADGE_CATALOG"
          :key="b.code"
          class="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-grey-5 text-caption1 font-semibold text-grey-10 whitespace-nowrap"
          @click="showBadge(b)"
        >{{ b.name }}</button>
      </div>
      <!-- 미션 레벨 선택 (컨플루언스 표 기준 미션 구성) -->
      <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          v-for="lv in 10"
          :key="lv"
          class="shrink-0 px-2.5 py-1.5 rounded-lg border text-caption1 font-semibold whitespace-nowrap"
          :class="missionLevel === lv ? 'bg-grey-13 text-grey-1 border-transparent' : 'bg-white text-grey-10 border-grey-5'"
          @click="selectLevel(lv)"
        >Lv.{{ lv }}</button>
      </div>
      <div class="flex gap-1.5 justify-center">
        <button class="px-2.5 py-1.5 rounded-lg bg-white border border-grey-5 text-caption1 font-semibold text-grey-10" @click="progress = (progress + 1) % (currentDef.target + 1)">진행 {{ progress }}/{{ currentDef.target }} → +1</button>
        <button
          v-if="currentDef.type === 'CONSECUTIVE_WEEK'"
          class="px-2.5 py-1.5 rounded-lg bg-white border border-grey-5 text-caption1 font-semibold text-grey-10"
          @click="withWeeklyStatus = !withWeeklyStatus"
        >요일 데이터 {{ withWeeklyStatus ? 'ON' : 'OFF' }}</button>
      </div>
    </div>

    <!-- 레벨별 미션 카드 -->
    <div class="absolute inset-x-0 top-44 z-[58] px-5">
      <HomeMissionCard :data="previewMission" />
    </div>

    <!-- 미션 완료(레벨업) 팝업 — home.vue와 동일한 오버레이 구성 -->
    <Teleport to="#app-container">
      <div v-if="popup === 'levelup'" class="absolute inset-0 z-[65] flex items-center justify-center px-5" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-[5px]" @click="popup = null" />
        <HomeMissionPopup
          :level="Math.max(2, missionLevel)"
          :message="'한 주 동안 꾸준히 회고를 작성했네요.\n작은 기록이 좋은 습관의 시작이 될 수 있어요.'"
          class="relative"
          @confirm="popup = null"
        />
      </div>
    </Teleport>

    <!-- 미션 실패 팝업 -->
    <Teleport to="#app-container">
      <div v-if="popup === 'failure'" class="absolute inset-0 z-[65] flex items-center justify-center px-5" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <!-- 실패 팝업은 일반 딤 (진한 딤+블러는 획득/완료 팝업 전용) -->
        <div class="absolute inset-0 bg-black/40" @click="popup = null" />
        <HomeMissionFailurePopup
          message="이번 주에 회고를 작성하지 않아
연속 기록이 초기화되었어요.
다시 2주 연속 회고에 도전해보세요."
          class="relative"
          @retry="popup = null"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { BADGE_CATALOG, type BadgeDef } from '~/composables/useBadges'
import type { CurrentMissionResponse, MissionType } from '~/types/api'

// 개발 전용 디자인 프리뷰 — 미션 완료/실패 팝업·배지 획득 팝업·레벨별 미션 카드
definePageMeta({ layout: false })

// 프로덕션에서는 접근 차단
if (!import.meta.dev) navigateTo('/home')

const popup = ref<'levelup' | 'failure' | null>(null)

// 배지 획득 팝업 — 전역 UiBadgeAcquiredPopup(useBadgeAcquired)로 표시. 연속 클릭 시 큐로 순차 노출
const { show, hide } = useBadgeAcquired()

function showBadge(def: BadgeDef) {
  popup.value = null
  show({ ...def, image: `/badges/${def.code}.svg`, acquired: true, acquiredAt: null, current: 0 })
}

function closeAll() {
  popup.value = null
  hide()
}

// ── 레벨별 미션 카드 프리뷰 (컨플루언스 표 기준 — 피그마 매핑은 예진님 컨펌 대기) ──
interface PreviewMissionDef {
  type: MissionType
  title: string
  description: string
  target: number
  remainingDays: number | null
}

const LEVEL_MISSIONS: Record<number, PreviewMissionDef> = {
  1: { type: 'FIRST_RETRO', title: '첫 회고 작성', description: '첫 회고를 작성해보세요', target: 1, remainingDays: null },
  2: { type: 'TIME_LIMITED', title: '일주일 내에 회고 3회 작성하기', description: '', target: 3, remainingDays: 5 },
  3: { type: 'CONSECUTIVE_WEEK', title: '2주 연속 회고하기', description: '매주 한 번씩 작성하면 달성할 수 있어요', target: 2, remainingDays: null },
  4: { type: 'CUMULATIVE_RETRO', title: '회고 3회 작성하기', description: '회고를 3회 작성하면 달성할 수 있어요', target: 3, remainingDays: null },
  5: { type: 'CONSECUTIVE_WEEK', title: '3주 연속 회고하기', description: '매주 한 번씩 작성하면 달성할 수 있어요', target: 3, remainingDays: null },
  6: { type: 'CUMULATIVE_RETRO', title: '회고 5회 작성하기', description: '회고를 5회 작성하면 달성할 수 있어요', target: 5, remainingDays: null },
  7: { type: 'CONSECUTIVE_WEEK', title: '4주 연속 회고하기', description: '매주 한 번씩 작성하면 달성할 수 있어요', target: 4, remainingDays: null },
  8: { type: 'CUMULATIVE_RETRO', title: '회고 7회 작성하기', description: '회고를 7회 작성하면 달성할 수 있어요', target: 7, remainingDays: null },
  9: { type: 'CONSECUTIVE_WEEK', title: '5주 연속 회고하기', description: '매주 한 번씩 작성하면 달성할 수 있어요', target: 5, remainingDays: null },
  10: { type: 'CUMULATIVE_RETRO', title: '회고 10회 작성하기', description: '회고를 10회 작성하면 달성할 수 있어요', target: 10, remainingDays: null },
}

const missionLevel = ref(3)
const progress = ref(1)
const withWeeklyStatus = ref(true)

const currentDef = computed(() => LEVEL_MISSIONS[missionLevel.value] ?? LEVEL_MISSIONS[1]!)

function selectLevel(lv: number) {
  missionLevel.value = lv
  progress.value = Math.min(1, (LEVEL_MISSIONS[lv]?.target ?? 1))
}

const previewMission = computed<CurrentMissionResponse>(() => ({
  currentLevel: missionLevel.value - 1, // 카드에는 미션 레벨(currentLevel+1)이 표시됨
  mission: {
    ...currentDef.value,
    progress: Math.min(progress.value, currentDef.value.target),
    cta: '회고 남기기',
  },
  weeklyStatus:
    currentDef.value.type === 'CONSECUTIVE_WEEK' && withWeeklyStatus.value
      ? { weekDays: ['월', '화', '수', '목', '금', '토', '일'].map((day, i) => ({ day, isCompleted: i === 2 })) }
      : null,
  popup: { exists: false, type: null },
}))
</script>

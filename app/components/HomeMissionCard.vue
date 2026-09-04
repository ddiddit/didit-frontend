<template>
  <div class="bg-white rounded-2xl p-[22px] flex flex-col">
    <!-- 헤더: 레벨 뱃지 + 미션 제목 + 부가 설명 -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5">
        <span
          class="inline-flex items-center px-1.5 py-[3px] rounded-md text-[11px] font-semibold leading-[1.3] tracking-[-0.02em] shrink-0"
          :style="{ backgroundColor: theme.light, color: theme.accent }"
        >
          Lv.{{ missionLevel }}
        </span>
        <span class="flex-1 min-w-0 text-[18px] font-semibold text-grey-13 leading-[1.4] tracking-[-0.02em] line-clamp-1">
          {{ m?.title }}
        </span>
      </div>
      <p class="text-[14px] font-medium text-grey-8 leading-[1.4] tracking-[-0.02em]">{{ subtitle }}</p>
    </div>

    <!-- 연속 주 미션: 주 단위 프로그레스 바 + 이번 주 요일 현황 -->
    <template v-if="isWeekly && m">
      <div class="flex flex-col gap-2">
        <!-- 16px 두꺼운 바: 연한 accent 채움 + 흰 점(주차 마커) -->
        <div class="relative h-4 rounded-full bg-grey-4">
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
            :style="{ width: barWidth, backgroundColor: theme.fill }"
          />
          <div class="absolute inset-0 flex items-center justify-between px-1.5">
            <span v-for="n in m.target + 1" :key="n" class="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div class="flex justify-between text-[12px] font-semibold text-grey-6">
          <span v-for="n in m.target + 1" :key="n" class="w-5 text-center">{{ n === 1 ? '0' : `${n - 1}주` }}</span>
        </div>
      </div>

      <!-- 이번 주 회고 현황 (데이터가 없어도 요일 스탬프는 항상 노출) -->
      <div class="flex flex-col gap-3">
        <p class="text-[14px] font-semibold text-grey-9 tracking-[-0.02em]">이번 주 회고 현황</p>
        <div class="flex gap-2">
          <div
            v-for="d in weekDays"
            :key="d.day"
            class="flex-1 aspect-square max-w-11 rounded-xl flex items-center justify-center text-[15px] font-semibold"
            :class="d.isCompleted ? 'bg-green-light-hover text-green-hover' : 'bg-grey-4 text-grey-6'"
          >
            {{ d.day }}
          </div>
        </div>
      </div>
    </template>

    <!-- 횟수형 미션: 원형 스텝 (8개 이상은 5개씩 줄바꿈 — Figma Lv.9) -->
    <template v-else-if="m">
        <div
          v-for="(row, ri) in circleRows"
          :key="ri"
          class="relative w-full"
          :class="missionLevel != 2 ? 'mt-[20px] pb-[45px]' : 'py-[20px] flex justify-center'"
        >
          <!-- 연결선 + 진행바 (Lv.2 외 나머지 레벨) -->
          <div v-if="missionLevel !== 2 && row.length >= 1" class="relative w-full h-[16px] rounded-[8px] bg-grey-4">
           <div
              v-if="rowFillFrac(row) > 0"
              class="progress h-full rounded-[8px_0px_0px_8px]"
              :style="{ width: `${rowFillFrac(row) * 100}%`, backgroundColor: theme.fill }"
            />
            <div class="exp_wrapper absolute top-0 left-[8px] right-[8px] flex justify-between">
              <div class="zero">
                <span class="block my-[4px] w-[8px] h-[8px] bg-grey-1 rounded-full"></span>
                <span class="block mt-[8px] text-grey-6">0</span>
              </div>
              <template v-for="(number, i) in row" :key="i">
                <div class="other_number">
                  <span class="block my-[4px] w-[8px] h-[8px] bg-grey-1 rounded-full"></span>
                  <span class="block mt-[8px] text-grey-6 ml-[1px]">{{ number }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Lv.2: 개별 스탬프 (target 개수만큼, progress 만큼 채움) -->
          <div v-else-if="missionLevel === 2 && row.length >= 1" class="level_2_stamp_wrapper relative inline-flex justify-center items-center gap-[20px]">
            <div
              v-for="(number, i) in row"
              :key="i"
              class="level_2_stamp relative z-[10] flex flex-col items-center gap-[4px]"
              :class="{ 'level_2_stamp_done': number <= m.progress }"
            >
              <div class="rounded-full" :class="number <= m.progress ? 'bg-green-light-hover' : 'bg-grey-4'">           
                <img v-if="number <= m.progress" src="/icons/check-on.svg" alt="check_on" class="p-[6px]" />
                <img v-else src="/icons/check-off.svg" alt="check_off" class="p-[6px]" />
              </div>
              <span class="text-[14px]" :class="number <= m.progress ? 'text-green' : 'text-grey-4'">{{ number }}회</span>
            </div>
          </div>

          <template v-for="n in row" :key="n" class="flex flex-col items-center gap-1.5 shrink-0 w-9">
            <!--레벨업 힌트 뱃지: 마지막 원형 오른쪽에 분리 노출 (초반 온보딩용 — 미션 레벨 1·2에서만) -->
            <div
              v-if="missionLevel != 2 && n === m.target"
              class="absolute right-0 bottom-[calc(100%+5px)] flex flex-col items-center whitespace-nowrap"
            >
              <span class="-ml-[3px] relative z-10 inline-flex items-center bg-grey-11 text-grey-1 text-[11px] font-medium px-[7px] py-[4px] rounded-md leading-[1.3] tracking-[-0.22px]">레벨업</span>
              <svg width="10" height="9" viewBox="0 0 10 9" fill="none" class="relative top-[-2px]">
                <path d="M6.47691 8.15138C5.78018 9.28287 4.21982 9.28287 3.52309 8.15138L0.291 2.90245C-0.477095 1.65506 0.365085 -1.59584e-08 1.76791 -7.72779e-08L8.23209 5.93838e-07C9.63492 5.32519e-07 10.4771 1.65507 9.709 2.90246L6.47691 8.15138Z" fill="#353535"/>
              </svg>
            </div>
            <div
              v-else-if="missionLevel == 2"
              class="absolute right-[90px] flex flex-col items-center whitespace-nowrap"
            >
              <span class="-ml-[3px] relative z-10 inline-flex items-center bg-grey-11 text-grey-1 text-[11px] font-medium px-[7px] py-[4px] rounded-md leading-[1.3] tracking-[-0.22px]">레벨업</span>
              <svg width="9" height="10" viewBox="0 0 9 10" fill="none" class="absolute right-[calc(100%-2px)] top-0 bottom-0 my-auto">
                <path d="M0.848617 6.47691C-0.282874 5.78018 -0.282872 4.21982 0.848619 3.52309L6.09755 0.291C7.34494 -0.477095 9 0.365085 9 1.76791L9 8.23209C9 9.63492 7.34493 10.4771 6.09754 9.709L0.848617 6.47691Z" fill="#353535"/>
              </svg>
            </div>
          </template>
      </div>
    </template>

    <!-- CTA: 회고 남기기 (오늘 회고 횟수 소진 시 비활성 — FAB와 동일) -->
    <button
      class="w-full py-3 rounded-xl text-[16px] font-semibold tracking-[-0.02em] transition-opacity"
      :class="disabled ? 'bg-grey-5 text-grey-6 cursor-not-allowed' : 'bg-primary text-grey-13 active:opacity-80'"
      :disabled="disabled"
      @click="emit('start')"
    >
      {{ m?.cta ?? '회고 남기기' }}
    </button>
  </div>
</template>
<style scoped>
  .level_2_stamp_wrapper:after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 13px;
    height: 2px;
    background-color: #f1f1f1;
  }
</style>
<script setup lang="ts">
import { levelTheme } from '~/utils/levelTheme'
import type { CurrentMissionResponse } from '~/types/api'

const props = defineProps<{ data: CurrentMissionResponse; disabled?: boolean }>()
const emit = defineEmits<{ start: [] }>()

// 미션 상세 (nested) — 최고 레벨 등에서는 null
const m = computed(() => props.data.mission)

const isWeekly = computed(() => m.value?.type === 'CONSECUTIVE_WEEK')

// 부가 설명: 기한제→남은 일수, 그 외→설명
const subtitle = computed(() => {
  const d = m.value
  if (!d) return ''
  if (d.type === 'TIME_LIMITED' && d.remainingDays != null) {
    return `미션 완료까지 ${d.remainingDays}일 남았어요`
  }
  return d.description
})

// 횟수형 원형 스텝: 8개 이상이면 5개씩 줄바꿈 (Figma Lv.9 = 10회 → 5+5)
const circleRows = computed(() => {
  const total = m.value?.target ?? 0
  const per = total > 7 ? Math.ceil(total / 2) : total
  const rows: number[][] = []
  for (let i = 1; i <= total; i += per) {
    rows.push(Array.from({ length: Math.min(per, total - i + 1) }, (_, k) => i + k))
  }
  return rows
})

// 카드에는 '진행 중인 미션'의 레벨을 표시 — 백엔드 currentLevel은 달성한 레벨이라 +1 (레벨 0 없음, 모든 유저 Lv.1부터)
const missionLevel = computed(() => props.data.currentLevel + 1)

// 완료 구간 연결선 비율: 해당 줄에서 완료된 스탬프 수 기준 (첫 스탬프 중심 → 마지막 완료 스탬프 중심)
function rowFillFrac(row: number[]): number {
  const p = m.value?.progress ?? 0
  const done = Math.min(Math.max(p - (row[0] ?? 1) + 1, 0), row.length)
  if (done <= 1 || row.length <= 1) return 0
  return (done - 1) / (row.length - 1)
}

// 레벨별 색상은 공용 유틸(levelTheme)에서 — 미션카드·마이페이지 공유
const theme = computed(() => levelTheme(missionLevel.value))

// 주간 미션 요일 스탬프 — 백엔드 days(월~일 boolean[])를 요일 라벨과 zip. 데이터 없으면 전부 미완료
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const weekDays = computed(() => {
  const days = props.data.weeklyStatus?.days ?? []
  return WEEKDAY_LABELS.map((day, i) => ({ day, isCompleted: days[i] ?? false }))
})

// 진행 바 채움: 해당 주차의 흰 점을 완전히 덮는 지점까지 (figma 실측: 바 306px 기준 1/2 진행 = 163px)
const barWidth = computed(() => {
  const d = m.value
  if (!d || d.progress <= 0) return '0px'
  const ratio = Math.min(1, d.progress / d.target)
  return `calc((100% - 20px) * ${ratio} + 20px)`
})
</script>

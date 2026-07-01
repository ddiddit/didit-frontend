<template>
  <div class="bg-white rounded-2xl p-[22px] flex flex-col gap-5">
    <!-- 헤더: 레벨 뱃지 + 미션 제목 + 부가 설명 -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5">
        <span
          class="inline-flex items-center px-1.5 py-[3px] rounded-md text-[11px] font-semibold leading-[1.3] tracking-[-0.02em] shrink-0"
          :style="{ backgroundColor: theme.light, color: theme.accent }"
        >
          Lv.{{ data.currentLevel }}
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

      <!-- 이번 주 회고 현황 -->
      <div v-if="data.weeklyStatus" class="flex flex-col gap-3">
        <p class="text-[14px] font-semibold text-grey-9 tracking-[-0.02em]">이번 주 회고 현황</p>
        <div class="flex gap-2">
          <div
            v-for="d in data.weeklyStatus.weekDays"
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
      <div class="flex flex-col gap-2.5">
        <div
          v-for="(row, ri) in circleRows"
          :key="ri"
          class="relative w-max mx-auto flex items-start gap-2 px-0.5"
        >
          <!-- 연결선 (첫~마지막 스탬프 중심) -->
          <div class="absolute left-[18px] right-[18px] top-[18px] h-[2px] bg-grey-3" />
          <div v-for="n in row" :key="n" class="relative flex flex-col items-center gap-1.5 shrink-0 w-9">
            <!-- 스탬프 (Figma): 완료=accent 원+#353535 체크 / 미완료=#F1F1F1 원+#C6C6C6 체크 -->
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" class="shrink-0">
              <rect width="36" height="36" rx="18" :fill="n <= m.progress ? theme.fill : '#F1F1F1'" />
              <path
                d="M25 14.3706L16.1446 23L11 17.9863L12.6307 16.6157L16.1446 20.0401L23.3693 13L25 14.3706Z"
                :fill="n <= m.progress ? '#353535' : '#C6C6C6'"
              />
            </svg>
            <span class="text-[12px] font-semibold text-grey-6 leading-[1.36] whitespace-nowrap">{{ n }}회</span>

            <!-- 레벨업 힌트 뱃지: 마지막 원형 오른쪽에 분리 노출 (첫 미션에서만) -->
            <div
              v-if="firstMission && n === m.target"
              class="absolute left-full top-[5px] ml-2 flex items-center whitespace-nowrap"
            >
              <!-- 포인터: 둥근 삼각형(Figma Polygon 5) — 뱃지에 겹쳐 붙여 말풍선처럼 -->
              <svg width="9" height="10" viewBox="0 0 9 10" fill="none" class="shrink-0 relative z-0">
                <path d="M0.848617 6.47691C-0.282874 5.78018 -0.282872 4.21982 0.848619 3.52309L6.09755 0.291C7.34494 -0.477095 9 0.365085 9 1.76791L9 8.23209C9 9.63492 7.34493 10.4771 6.09754 9.709L0.848617 6.47691Z" fill="#353535" />
              </svg>
              <span class="-ml-[3px] relative z-10 inline-flex items-center bg-grey-11 text-grey-1 text-[11px] font-medium px-[7px] py-[4px] rounded-md leading-[1.3] tracking-[-0.22px]">레벨업</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- CTA: 회고 남기기 -->
    <button
      class="w-full py-3 rounded-xl bg-primary text-[16px] font-semibold text-grey-13 tracking-[-0.02em] transition-opacity active:opacity-80"
      @click="emit('start')"
    >
      {{ m?.cta ?? '회고 남기기' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { levelTheme } from '~/utils/levelTheme'
import type { CurrentMissionResponse } from '~/types/api'

const props = defineProps<{ data: CurrentMissionResponse; firstMission?: boolean }>()
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

// 레벨별 색상은 공용 유틸(levelTheme)에서 — 미션카드·마이페이지 공유
const theme = computed(() => levelTheme(props.data.currentLevel))

const barWidth = computed(() =>
  m.value ? `${Math.min(100, (m.value.progress / m.value.target) * 100)}%` : '0%',
)
</script>

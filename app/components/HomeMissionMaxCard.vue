<template>
  <!-- 최고 레벨(Lv.10): 진행할 미션이 없어 '이번 주 회고 현황'만 노출 (Figma 8173-30195) -->
  <div class="bg-white rounded-2xl p-[22px] flex flex-col gap-3">
    <p class="text-[14px] font-semibold text-grey-9 leading-[1.4] tracking-[-0.02em]">이번 주 회고 현황</p>
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

<script setup lang="ts">
import type { WeeklyRetroStatus } from '~/types/api'

const props = defineProps<{ weeklyStatus?: WeeklyRetroStatus | null }>()

// 이번 주 요일 스탬프 — 백엔드 days(월~일 boolean[])를 요일 라벨과 zip. 데이터 없으면 전부 미완료
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const weekDays = computed(() => {
  const days = props.weeklyStatus?.days ?? []
  return WEEKDAY_LABELS.map((day, i) => ({ day, isCompleted: days[i] ?? false }))
})
</script>

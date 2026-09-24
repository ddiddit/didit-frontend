<template>
  <div class="flex flex-col gap-[30px] w-full">
    <!-- 제목 + 메타(프로젝트/태그) -->
    <div class="flex flex-col" :class="variant === 'result' ? 'gap-[14px]' : ''">
      <!-- 작성 날짜 (상세 화면 전용) -->
      <p v-if="variant === 'detail' && date" class="text-label1 font-medium text-grey-8">{{ date }}</p>
      <!-- 상세 화면은 제목 하단 라인 미노출 -->
      <div
        class="flex items-center gap-[10px] pt-3 pb-[14px]"
        :class="variant === 'result' ? 'border-b border-grey-4' : ''"
      >
        <!-- 저장 화면: 제목 편집 가능 (AI 자동생성, 공백 포함 최대 25자) -->
        <input
          v-if="editableTitle"
          :value="title"
          maxlength="25"
          placeholder="회고 제목을 입력하세요"
          class="flex-1 min-w-0 bg-transparent outline-none text-[19px] font-semibold text-grey-13 leading-[1.4] tracking-[-0.38px] placeholder:text-grey-6"
          @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
        />
        <p v-else class="flex-1 text-[19px] font-semibold text-grey-13 leading-[1.4] tracking-[-0.38px]">
          {{ title }}
        </p>
        <!-- 제목 지우기(X) — 저장 화면 -->
        <button
          v-if="editableTitle && title.length > 0"
          class="shrink-0"
          aria-label="제목 지우기"
          @click="$emit('update:title', '')"
        >
          <img src="/icons/delete-circle.svg" alt="제목 지우기" class="w-6 h-6" />
        </button>
        <button v-else-if="deletable" class="shrink-0" aria-label="삭제" @click="$emit('delete')">
          <img src="/icons/delete.svg" alt="삭제" class="w-6 h-6" />
        </button>
      </div>

      <div class="flex flex-col gap-[5px]">
        <component
          :is="editableMeta ? 'button' : 'div'"
          class="flex h-6 items-center justify-between"
          @click="editableMeta && $emit('edit-project')"
        >
          <span class="flex gap-3 items-center text-label2 font-medium">
            <span class="text-grey-7 w-[50px] text-left">프로젝트</span>
            <!-- 상세 화면: 프로젝트가 있으면 해당 프로젝트 회고 목록으로 이동하는 링크 -->
            <button
              v-if="variant === 'detail' && projectName"
              class="text-grey-12 underline"
              @click="$emit('open-project')"
            >{{ projectName }}</button>
            <span v-else class="text-grey-8">{{ projectName || '자유 회고' }}</span>
          </span>
          <img v-if="editableMeta" src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
        </component>
        <component
          :is="editableMeta ? 'button' : 'div'"
          class="flex min-h-6 items-center justify-between gap-2"
          @click="editableMeta && $emit('edit-tags')"
        >
          <span class="flex gap-3 items-center text-label2 font-medium min-w-0">
            <span class="text-grey-7 w-[50px] text-left shrink-0">태그</span>
            <span v-if="tags && tags.length" class="flex gap-[6px] flex-wrap">
              <UiTag v-for="t in tags" :key="t.id" :color="getTagColor(t.id)">#{{ t.name }}</UiTag>
            </span>
            <span v-else class="text-grey-8">태그 없음</span>
          </span>
          <img v-if="editableMeta" src="/icons/chevron-right.svg" alt="" class="w-5 h-5 shrink-0" />
        </component>
      </div>
    </div>

    <!-- 본문 -->
    <div class="flex flex-col gap-5">
      <!-- 회고 요약 -->
      <div class="bg-grey-3 rounded-2xl p-[22px] flex flex-col gap-[10px]">
        <p class="text-label2 font-semibold text-grey-7">회고 요약</p>
        <p class="text-body3-reading text-grey-13 whitespace-pre-line">{{ content.summary }}</p>
      </div>

      <!-- 막힌 지점 / 해결 과정 / 배운 점 -->
      <div class="bg-grey-1 rounded-[9px] p-2 flex flex-col gap-5">
        <template v-for="(section, i) in listSections" :key="section.key">
          <div v-if="section.items.length" class="flex flex-col gap-[6px]">
            <p class="text-body3 font-semibold text-grey-10">{{ section.label }}</p>
            <ul class="flex flex-col gap-[2px] text-body3-reading text-grey-13">
              <li v-for="(item, j) in section.items" :key="j" class="list-disc ms-[22px]">
                {{ item }}
              </li>
            </ul>
          </div>
          <div v-if="section.items.length && i < listSections.length - 1" class="h-px bg-grey-4" />
        </template>
      </div>

      <!-- 인사이트 / 다음 행동 제안 (v2는 다음 행동 제안이 여러 개일 수 있음) -->
      <div class="flex flex-col gap-4">
        <div class="bg-grey-3 rounded-2xl p-[22px] flex flex-col gap-[6px]">
          <p class="text-label2 font-semibold text-green-hover">인사이트</p>
          <p class="text-body2-reading font-semibold text-grey-10">{{ content.insight.title }}</p>
          <p class="text-body3-reading text-grey-13 whitespace-pre-line">{{ content.insight.description }}</p>
        </div>
        <div v-for="(action, i) in nextActions" :key="i" class="bg-grey-3 rounded-2xl p-[22px] flex flex-col gap-[6px]">
          <p class="text-label2 font-semibold text-green-hover">다음 행동 제안</p>
          <p class="text-body2-reading font-semibold text-grey-10">{{ action.title }}</p>
          <p class="text-body3-reading text-grey-13 whitespace-pre-line">{{ action.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RetrospectiveContent, RetrospectiveResultV2, Tag } from '~/types/api'
import { getTagColor } from '~/utils/tag-color'

const props = withDefaults(
  defineProps<{
    title: string
    // v1(RetrospectiveContent)·v2(RetrospectiveResultV2) 필드명이 달라 두 형태 모두 받아 화면에서 흡수한다
    content: RetrospectiveContent | RetrospectiveResultV2
    projectName?: string | null
    tags?: Tag[]
    editableTitle?: boolean // 저장 화면에서 제목 입력 가능
    editableMeta?: boolean // 결과 화면(저장 전)에서 프로젝트/태그 편집 가능
    deletable?: boolean
    variant?: 'result' | 'detail' // 상세: 날짜 노출, 제목 하단 라인 미노출, 프로젝트 링크
    date?: string | null // 상세 화면에 노출할 작성 날짜 (예: 2026년 3월 5일)
  }>(),
  { projectName: null, tags: () => [], editableTitle: false, editableMeta: false, deletable: false, variant: 'result', date: null },
)

defineEmits<{ delete: []; 'edit-project': []; 'edit-tags': []; 'open-project': []; 'update:title': [value: string] }>()

// v2는 강점/개선점/진행 과정/배운 점, v1은 막힌 지점/해결 과정/배운 점 — 필드명으로 형태를 구분한다
const listSections = computed(() => {
  const c = props.content
  if ('strengths' in c) {
    return [
      { key: 'strengths', label: '잘한 점', items: c.strengths ?? [] },
      { key: 'improvements', label: '개선점', items: c.improvements ?? [] },
      { key: 'processes', label: '진행 과정', items: c.processes ?? [] },
      { key: 'learnings', label: '배운 점', items: c.learnings ?? [] },
    ]
  }
  return [
    { key: 'blocked', label: '막힌 지점', items: c.blockedPoint ?? [] },
    { key: 'solution', label: '해결 과정', items: c.solutionProcess ?? [] },
    { key: 'lesson', label: '배운 점', items: c.lessonLearned ?? [] },
  ]
})

// v1은 다음 행동 제안이 하나(nextAction), v2는 여러 개(nextActions) — 항상 배열로 통일해 노출한다
const nextActions = computed(() => {
  const c = props.content
  return 'nextActions' in c ? (c.nextActions ?? []) : c.nextAction ? [c.nextAction] : []
})
</script>

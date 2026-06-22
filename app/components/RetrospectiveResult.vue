<template>
  <div class="flex flex-col gap-[30px] w-full">
    <!-- 제목 + 메타(프로젝트/태그) -->
    <div class="flex flex-col gap-[14px]">
      <div class="flex items-center gap-[10px] border-b border-grey-4 pt-3 pb-[14px]">
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
        <button
          class="flex h-6 items-center justify-between"
          :disabled="!editableMeta"
          @click="editableMeta && $emit('edit-project')"
        >
          <span class="flex gap-3 items-center text-label2 font-medium">
            <span class="text-grey-7 w-[50px] text-left">프로젝트</span>
            <span class="text-grey-8">{{ projectName || '자유 회고' }}</span>
          </span>
          <img v-if="editableMeta" src="/icons/chevron-right.svg" alt="" class="w-5 h-5" />
        </button>
        <button
          class="flex min-h-6 items-center justify-between gap-2"
          :disabled="!editableMeta"
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
        </button>
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

      <!-- 인사이트 / 다음 행동 제안 -->
      <div class="flex flex-col gap-4">
        <div class="bg-grey-3 rounded-2xl p-[22px] flex flex-col gap-[6px]">
          <p class="text-label2 font-semibold text-green-hover">인사이트</p>
          <p class="text-body2-reading font-semibold text-grey-10">{{ content.insight.title }}</p>
          <p class="text-body3-reading text-grey-13 whitespace-pre-line">{{ content.insight.description }}</p>
        </div>
        <div class="bg-grey-3 rounded-2xl p-[22px] flex flex-col gap-[6px]">
          <p class="text-label2 font-semibold text-green-hover">다음 행동 제안</p>
          <p class="text-body2-reading font-semibold text-grey-10">{{ content.nextAction.title }}</p>
          <p class="text-body3-reading text-grey-13 whitespace-pre-line">{{ content.nextAction.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RetrospectiveContent, Tag } from '~/types/api'
import { getTagColor } from '~/utils/tag-color'

const props = withDefaults(
  defineProps<{
    title: string
    content: RetrospectiveContent
    projectName?: string | null
    tags?: Tag[]
    editableTitle?: boolean // 저장 화면에서 제목 입력 가능
    editableMeta?: boolean // 결과 화면(저장 전)에서 프로젝트/태그 편집 가능
    deletable?: boolean
  }>(),
  { projectName: null, tags: () => [], editableTitle: false, editableMeta: false, deletable: false },
)

defineEmits<{ delete: []; 'edit-project': []; 'edit-tags': []; 'update:title': [value: string] }>()

const listSections = computed(() => [
  { key: 'blocked', label: '막힌 지점', items: props.content.blockedPoint ?? [] },
  { key: 'solution', label: '해결 과정', items: props.content.solutionProcess ?? [] },
  { key: 'lesson', label: '배운 점', items: props.content.lessonLearned ?? [] },
])
</script>

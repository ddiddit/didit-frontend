<template>
  <div class="h-full bg-white flex flex-col overflow-y-auto">

    <!-- 헤더 -->
    <div
      class="flex items-center px-5 h-[50px] shrink-0 relative"
    >
      <button class="p-1 -ml-1 flex items-center" @click="navigateTo('/retrospects')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6 block" />
      </button>
      <span class="absolute left-1/2 -translate-x-1/2 text-body2 font-semibold text-grey-13">회고 검색</span>
    </div>

    <!-- 검색 입력 -->
    <div class="px-5 pt-4 shrink-0">
      <div class="flex items-center bg-grey-3 rounded-xl px-4 h-[56px] gap-2">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="키워드로 검색해 보세요."
          class="flex-1 bg-transparent text-body3 font-medium text-grey-13 placeholder:text-grey-7 placeholder:font-normal outline-none"
          @keydown.enter="onEnter"
          @compositionstart="isComposing = true"
          @compositionend="onCompositionEnd"
        />
        <button v-if="!searchQuery" class="flex items-center shrink-0">
          <img src="/icons/search.svg" alt="검색" class="w-6 h-6 block" />
        </button>
        <button v-else class="flex items-center shrink-0" @click="clearQuery">
          <img src="/icons/delete-circle-dark.svg" alt="지우기" class="w-6 h-6 block" />
        </button>
      </div>
    </div>

    <!-- 최근 검색어 -->
    <div v-if="recentSearches.length > 0" class="px-5 mt-[30px] shrink-0">
      <div class="flex items-center justify-between mb-3">
        <span class="text-label1 font-semibold text-grey-13">최근 검색어</span>
        <button class="text-caption1 font-medium text-grey-7" @click="clearAllRecent">전체 삭제</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in recentSearches"
          :key="item"
          class="flex items-center gap-2 py-[9px] pl-[14px] pr-3 bg-white border border-grey-4 rounded-full"
          @click="goSearch(item)"
        >
          <span class="text-label2 font-medium text-grey-13">{{ item }}</span>
          <span class="flex items-center shrink-0" @click.stop="removeRecent(item)">
            <img src="/icons/close.svg" class="w-4 h-4 block" style="filter: brightness(0) invert(1) brightness(0.776)" />
          </span>
        </button>
      </div>
    </div>

    <!-- 태그 섹션 -->
    <div v-if="tags.length > 0" class="px-5 mt-[30px] shrink-0">
      <span class="text-label1 font-semibold text-grey-13 block mb-3">태그</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(tag, index) in tags"
          :key="tag.id"
          class="py-[4px] px-[6px] rounded-[6px] font-semibold whitespace-nowrap"
          :style="{
            fontSize: '11px',
            lineHeight: '130%',
            letterSpacing: '-0.02em',
            backgroundColor: tagColors[index % tagColors.length].bg,
            color: tagColors[index % tagColors.length].text,
          }"
          @click="goSearchByTag(tag.name)"
        >#{{ tag.name }}</button>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="recentSearches.length === 0 && tags.length === 0"
      class="flex-1 flex items-center justify-center pb-20"
    >
      <p class="text-[14px] font-normal text-grey-9 text-center leading-[1.6] tracking-[-0.02em]">
        회고 제목이나 키워드로<br />저장된 회고를 검색해 보세요.
      </p>
    </div>

    <div class="pb-6 shrink-0" />

  </div>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()
const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')

const RECENT_KEY = 'recentSearches'
const MAX_RECENT = 10
const recentSearches = ref<string[]>([])
const tags = ref<Tag[]>([])

// 태그 색상은 프론트에서 순환 할당 (백엔드에 color 필드 없음)
const tagColors = [
  { bg: '#E2FAF0', text: '#37C58A' },
  { bg: '#FAEBFA', text: '#E079E0' },
  { bg: '#E6EEFC', text: '#5A8DEE' },
  { bg: '#FDEDE7', text: '#F08A5D' },
  { bg: '#EEEBFD', text: '#8C7CF0' },
  { bg: '#FAF3E1', text: '#DEAD3A' },
  { bg: '#FDECEC', text: '#F06C6C' },
  { bg: '#EBF7E8', text: '#77C767' },
  { bg: '#E8F2FA', text: '#65ABE0' },
  { bg: '#F7EEE7', text: '#C78B5C' },
]

onMounted(async () => {
  const saved = localStorage.getItem(RECENT_KEY)
  recentSearches.value = saved ? JSON.parse(saved) : []
  nextTick(() => inputRef.value?.focus())
  await fetchTags()
})

async function fetchTags() {
  try {
    const res = await $api.get<{ data: Tag[] }>('/api/v1/tags')
    tags.value = res.data.data
  } catch {
    tags.value = []
  }
}

const isComposing = ref(false)

function onCompositionEnd() {
  isComposing.value = false
}

function onEnter(event: KeyboardEvent) {
  if (event.isComposing || isComposing.value) return
  const keyword = searchQuery.value.trim()
  if (!keyword) return
  goSearch(keyword)
}

function goSearch(keyword: string) {
  saveRecent(keyword)
  navigateTo(`/retrospects?keyword=${encodeURIComponent(keyword)}`)
}

// 태그 클릭은 최근 검색어에 추가하지 않음
function goSearchByTag(tagName: string) {
  navigateTo(`/retrospects?keyword=${encodeURIComponent(tagName)}`)
}

function clearQuery() {
  searchQuery.value = ''
  inputRef.value?.focus()
}

function saveRecent(keyword: string) {
  const list = recentSearches.value.filter(k => k !== keyword)
  list.unshift(keyword)
  recentSearches.value = list.slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.value))
}

function removeRecent(keyword: string) {
  recentSearches.value = recentSearches.value.filter(k => k !== keyword)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.value))
}

function clearAllRecent() {
  recentSearches.value = []
  localStorage.removeItem(RECENT_KEY)
}
</script>

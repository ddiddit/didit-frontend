<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div
      class="flex items-center px-5 h-[50px] shrink-0 relative"
      style="margin-top: max(54px, env(safe-area-inset-top, 54px));"
    >
      <button class="p-1 -ml-1 flex items-center" @click="navigateTo('/retrospects')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6 block" />
      </button>
      <span class="absolute left-1/2 -translate-x-1/2 text-body2 font-semibold text-grey-13">회고 검색</span>
    </div>

    <!-- 검색 입력 -->
    <div class="px-5 pt-3 pb-4 shrink-0">
      <div class="flex items-center bg-grey-3 rounded-xl px-4 h-[46px] gap-2">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="키워드로 검색해 보세요."
          class="flex-1 bg-transparent text-body3 font-normal text-grey-13 placeholder:text-grey-6 outline-none"
          @input="onInput"
          @keydown.enter="onEnter"
        />
        <!-- 입력값 없을 때: 검색 아이콘 -->
        <button v-if="!searchQuery" class="flex items-center shrink-0">
          <img src="/icons/search.svg" alt="검색" class="w-5 h-5 block" />
        </button>
        <!-- 입력값 있을 때: X 클리어 버튼 -->
        <button v-else class="flex items-center shrink-0" @click="clearQuery">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="#C6C6C6"/>
            <path d="M7 7L13 13M13 7L7 13" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 최근 검색어 섹션 -->
    <div v-if="recentSearches.length > 0 && !hasResults" class="px-5 shrink-0">
      <div class="flex items-center justify-between mb-3">
        <span class="text-label1 font-semibold text-grey-13">최근 검색어</span>
        <button class="text-label2 font-normal text-grey-7" @click="clearAllRecent">전체 삭제</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in recentSearches"
          :key="item"
          class="flex items-center gap-1 h-[34px] px-3 bg-grey-3 rounded-full"
          @click="selectRecent(item)"
        >
          <span class="text-label2 font-normal text-grey-11">{{ item }}</span>
          <span class="flex items-center" @click.stop="removeRecent(item)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4L10 10M10 4L4 10" stroke="#989898" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>

    <!-- 검색 결과 -->
    <div v-if="hasResults" class="flex-1 overflow-y-auto scrollbar-hide">
      <ul>
        <li
          v-for="item in searchResults"
          :key="item.id"
          class="px-5 py-4 border-b border-grey-4"
          @click="navigateTo(`/retrospects/${item.id}`)"
        >
          <p class="text-label1 font-semibold text-grey-13 leading-[1.4]">{{ item.title }}</p>
          <p v-if="item.summary" class="text-label2 font-normal text-grey-7 mt-1 line-clamp-1">{{ item.summary }}</p>
          <p class="text-caption1 font-normal text-grey-6 mt-1">{{ formatDate(item.completedAt ?? item.createdAt) }}</p>
        </li>
      </ul>
      <!-- 결과 없음 -->
      <div v-if="searchQuery && searchResults.length === 0 && !isSearching" class="flex-1 flex flex-col items-center justify-center py-20 gap-2">
        <p class="text-body3 font-semibold text-grey-13">검색 결과가 없어요</p>
        <p class="text-label1 font-normal text-grey-7 text-center">"{{ searchQuery }}"에 대한 결과를 찾을 수 없어요.</p>
      </div>
    </div>

    <!-- 빈 상태 (검색어 없음, 최근 검색어 없음) -->
    <div
      v-if="!searchQuery && recentSearches.length === 0"
      class="flex-1 flex items-center justify-center pb-20"
    >
      <p class="text-label1 font-normal text-grey-7 text-center leading-[1.6]">
        회고 제목이나 키워드로<br />저장된 회고를 검색해 보세요.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { ApiResponse, PaginatedResponse, Retrospective } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default' })

const { $api } = useNuxtApp()

const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<Retrospective[]>([])
const isSearching = ref(false)

const RECENT_KEY = 'recentSearches'
const MAX_RECENT = 10

const recentSearches = ref<string[]>([])
const hasResults = computed(() => searchQuery.value.trim().length > 0)

onMounted(() => {
  const saved = localStorage.getItem(RECENT_KEY)
  recentSearches.value = saved ? JSON.parse(saved) : []
  nextTick(() => inputRef.value?.focus())
})

const debouncedSearch = useDebounceFn(async (keyword: string) => {
  if (!keyword.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const res = await $api.get<ApiResponse<PaginatedResponse<Retrospective>>>(
      `/api/v1/retrospects?keyword=${encodeURIComponent(keyword)}&page=0&size=20`
    )
    searchResults.value = res.data.data.data
  } catch {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}, 300)

function onInput() {
  debouncedSearch(searchQuery.value)
}

function onEnter() {
  if (!searchQuery.value.trim()) return
  saveRecent(searchQuery.value.trim())
  debouncedSearch.cancel?.()
  debouncedSearch(searchQuery.value)
}

function clearQuery() {
  searchQuery.value = ''
  searchResults.value = []
  inputRef.value?.focus()
}

function selectRecent(keyword: string) {
  searchQuery.value = keyword
  debouncedSearch(keyword)
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

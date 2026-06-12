<template>
  <div class="h-full bg-white flex flex-col">

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
          class="flex-1 bg-transparent text-body3 font-medium text-grey-13 placeholder:text-grey-7 outline-none"
          @keydown.enter="onEnter"
          @compositionstart="isComposing = true"
          @compositionend="onCompositionEnd"
        />
        <button v-if="!searchQuery" class="flex items-center shrink-0">
          <img src="/icons/search.svg" alt="검색" class="w-6 h-6 block" />
        </button>
        <button v-else class="flex items-center shrink-0" @click="clearQuery">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#6A6A6A"/>
            <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
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
          class="flex items-center gap-2 h-[36px] pl-[14px] pr-[9px] bg-white border border-grey-4 rounded-full overflow-hidden"
          @click="goSearch(item)"
        >
          <span class="text-label2 font-medium text-grey-13 truncate">{{ item }}</span>
          <span class="flex items-center shrink-0" @click.stop="removeRecent(item)">
            <img src="/icons/close.svg" class="w-4 h-4 block" style="filter: brightness(0) invert(1) brightness(0.776)" />
          </span>
        </button>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="recentSearches.length === 0"
      class="flex-1 flex items-center justify-center pb-20"
    >
      <p class="text-[14px] font-normal text-grey-9 text-center leading-[1.6] tracking-[-0.02em]">
        회고 제목이나 키워드로<br />저장된 회고를 검색해 보세요.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')

const RECENT_KEY = 'recentSearches'
const MAX_RECENT = 10
const recentSearches = ref<string[]>([])

onMounted(() => {
  const saved = localStorage.getItem(RECENT_KEY)
  recentSearches.value = saved ? JSON.parse(saved) : []
  nextTick(() => inputRef.value?.focus())
})

const isComposing = ref(false)

function onCompositionEnd() {
  isComposing.value = false
}

function onEnter(event: KeyboardEvent) {
  // 한국어 IME 조합 중 엔터 무시
  if (event.isComposing || isComposing.value) return
  const keyword = searchQuery.value.trim()
  if (!keyword) return
  goSearch(keyword)
}

function goSearch(keyword: string) {
  saveRecent(keyword)
  navigateTo(`/retrospects?keyword=${encodeURIComponent(keyword)}`)
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

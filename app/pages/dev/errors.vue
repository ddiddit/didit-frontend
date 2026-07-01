<template>
  <!-- 에러 UI 미리보기 (개발 전용). /dev/errors — 한 화면에 하나씩, ‹ ›로 넘김 -->
  <div class="relative mx-auto h-screen w-full max-w-mobile overflow-hidden bg-background">
    <!-- 현재 뷰: 전체 화면 에러 -->
    <UiErrorState
      v-if="current.type === 'full'"
      :variant="current.variant"
      :icon="current.icon"
      :title="current.title"
      :description="current.description"
      :action-text="current.actionText"
      class="h-full"
      @action="noop"
    />

    <!-- 현재 뷰: 인라인 배너 (맥락 배경 위에 배치) -->
    <div v-else class="h-full" :class="current.context === 'chat' ? 'bg-grey-1' : 'bg-background'">
      <UiInlineError
        :variant="current.variant === 'light' ? 'light' : 'dark'"
        :message="current.message"
        :retry-text="current.retryText"
        class="absolute bottom-20 left-5 right-5"
        @retry="noop"
      />
    </div>

    <!-- 컨트롤 바 (상단) -->
    <div class="absolute inset-x-0 top-0 z-50 flex items-center justify-between bg-grey-13/85 px-3 py-2 text-grey-1">
      <button class="rounded-lg px-3 py-1.5 text-label1 font-medium active:bg-grey-11" @click="prev">‹ 이전</button>
      <span class="text-label1 font-medium">{{ index + 1 }}/{{ views.length }} · {{ current.label }}</span>
      <button class="rounded-lg px-3 py-1.5 text-label1 font-medium active:bg-grey-11" @click="next">다음 ›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 개발 전용 — 프로덕션 빌드에서는 접근 시 홈으로
definePageMeta({ layout: false })
if (!import.meta.dev) navigateTo('/')

function noop() {}

type FullView = {
  label: string
  type: 'full'
  variant: 'network' | 'server' | 'generic'
  icon?: string
  title?: string
  description?: string
  actionText?: string
}
type BannerView = {
  label: string
  type: 'banner'
  context: 'chat' | 'list'
  variant: 'dark' | 'light'
  message: string
  retryText?: string
}

// figma 8개 시안 그대로
const views: (FullView | BannerView)[] = [
  { label: '홈·네트워크 끊김 (31331)', type: 'full', variant: 'network' },
  { label: '홈·일시적인 오류 (31346)', type: 'full', variant: 'server' },
  { label: '홈·알 수 없는 오류 (31361)', type: 'full', variant: 'generic' },
  {
    label: '상세·조회 실패 (31310)', type: 'full', variant: 'generic',
    icon: '/icons/error-reload.svg',
    title: '회고 내용을 불러오지 못했어요', description: '다시 시도해 주세요.', actionText: '다시 시도',
  },
  { label: '채팅·질문 불러오기 실패 (31182)', type: 'banner', context: 'chat', variant: 'dark', message: '질문을 불러오지 못했어요.\n다시 시도해 주세요.' },
  { label: '채팅·결과 생성 실패 (31141)', type: 'banner', context: 'chat', variant: 'dark', message: '회고 결과를 생성하지 못했어요.\n다시 시도해 주세요.' },
  { label: '목록·조회 실패, 버튼없음 (31219)', type: 'banner', context: 'list', variant: 'dark', message: '회고 내용을 불러오지 못했어요.\n네트워크 상태를 확인 후 다시 시도해 주세요.', retryText: '' },
  { label: '목록·응답 지연 (31267)', type: 'banner', context: 'list', variant: 'dark', message: '응답이 오래 걸리고 있어요.\n다시 시도해 주세요.' },
]

const index = ref(0)
const current = computed(() => views[index.value]!)
function prev() { index.value = (index.value - 1 + views.length) % views.length }
function next() { index.value = (index.value + 1) % views.length }
</script>

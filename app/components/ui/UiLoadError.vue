<template>
  <!-- 페이지 로드 실패: 타입별 전체화면 에러 (네트워크/서버/알수없음). 헤더 아래~탭바 위를 덮음 -->
  <UiErrorState
    v-if="error"
    :variant="error"
    class="absolute inset-x-0 bottom-0 z-40 bg-background"
    :style="{ top }"
    @action="onAction"
  />
  <!-- 응답 지연(5초 초과): 하단 다크 배너 (figma 요청 시간 초과/전 화면) -->
  <UiInlineError
    v-else-if="slow"
    variant="dark"
    :message="SLOW_MESSAGE"
    class="absolute bottom-4 left-5 right-5 z-40"
    @retry="emit('retry')"
  />
</template>

<script setup lang="ts">
// 데이터 로드 페이지 공통 에러 표시. useLoadState()의 loadError/slowLoading과 함께 사용.
interface Props {
  error?: 'network' | 'server' | 'generic' | null
  slow?: boolean
  top?: string // 헤더 높이만큼 비움 (기본 50px, 헤더 없으면 '0')
}
const props = withDefaults(defineProps<Props>(), {
  error: null,
  slow: false,
  top: '50px',
})
const emit = defineEmits<{ retry: [] }>()

const SLOW_MESSAGE = '응답이 오래 걸리고 있어요.\n다시 시도해 주세요.'

// 네트워크 끊김 → 재시도 / 서버·알수없음 → 문의하기
function onAction() {
  if (props.error === 'network') emit('retry')
  else navigateTo('/my/inquiry')
}
</script>

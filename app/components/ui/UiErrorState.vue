<template>
  <!-- 전체 화면 에러 상태 (네트워크 끊김·서버 오류 등). 부모가 높이를 주면 그 영역을 채워 중앙 정렬 -->
  <div class="flex w-full flex-1 flex-col items-center justify-center px-4">
    <!-- figma: 아이콘+텍스트 그룹 ↔ 버튼 gap 24 -->
    <div class="flex flex-col items-center gap-6">
      <!-- figma: 아이콘 ↔ 텍스트 gap 12 -->
      <div class="flex flex-col items-center gap-3">
        <img :src="resolved.icon" alt="" class="h-[70px] w-[70px]" />
        <!-- figma: 제목 ↔ 설명 gap 6 -->
        <div class="flex flex-col items-center gap-1.5 text-center">
          <p class="text-heading2 font-semibold text-grey-13">{{ resolved.title }}</p>
          <p v-if="resolved.description" class="text-label1-reading font-normal text-grey-9">
            {{ resolved.description }}
          </p>
        </div>
      </div>
      <!-- figma 8088:31342: bg primary, px16 py9, radius12, 16px SemiBold #191919 -->
      <button
        v-if="resolved.actionText"
        type="button"
        class="rounded-xl bg-primary px-4 py-[9px] text-body2 font-semibold text-grey-13 transition-colors duration-150 active:bg-green-active"
        @click="emit('action')"
      >
        {{ resolved.actionText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 상황별 에러 화면. variant로 기본 문구/아이콘을 고르고, 필요하면 개별 prop으로 덮어쓴다.
type ErrorVariant = 'network' | 'server' | 'generic'

interface Props {
  variant?: ErrorVariant
  icon?: string // public/ 기준 이미지 경로 (예: /icons/error-network.svg)
  title?: string
  description?: string
  actionText?: string // 빈 문자열이면 버튼 숨김
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'generic',
  icon: undefined,
  title: undefined,
  description: undefined,
  actionText: undefined,
})

const emit = defineEmits<{ action: [] }>()

// variant별 기본값 (아이콘은 피그마에서 받은 픽셀 일러스트 SVG)
const PRESETS: Record<ErrorVariant, { icon: string; title: string; description: string; actionText: string }> = {
  network: {
    icon: '/icons/error-network.svg',
    title: '인터넷이 연결되어 있지 않아요',
    description: '연결 후 다시 시도해 주세요.',
    actionText: '다시 시도',
  },
  server: {
    icon: '/icons/error-face.svg',
    title: '일시적인 오류가 발생했어요',
    description: '잠시 후 다시 시도해 주세요.',
    actionText: '문의하기',
  },
  generic: {
    icon: '/icons/error-face.svg',
    title: '알 수 없는 오류가 발생했어요',
    description: '앱을 다시 시작해 주세요.',
    actionText: '문의하기',
  },
}

// props가 지정되면 우선, 아니면 variant 기본값
const resolved = computed(() => {
  const preset = PRESETS[props.variant]
  return {
    icon: props.icon ?? preset.icon,
    title: props.title ?? preset.title,
    description: props.description ?? preset.description,
    actionText: props.actionText ?? preset.actionText,
  }
})
</script>

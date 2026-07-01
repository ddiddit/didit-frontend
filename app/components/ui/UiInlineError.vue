<template>
  <!-- 인라인 에러 배너 + 다시 시도. dark=어두운 배경(회고 진행 채팅), light=밝은 배경(목록 등) -->
  <div
    class="flex items-center gap-3 rounded-xl px-4 py-3"
    :class="variant === 'dark' ? 'bg-grey-10' : 'bg-grey-1 shadow-card'"
  >
    <Icon name="material-symbols:error-outline-rounded" class="h-5 w-5 shrink-0 text-danger" />
    <p
      class="flex-1 whitespace-pre-line text-label1 font-normal leading-[1.4]"
      :class="variant === 'dark' ? 'text-grey-1' : 'text-grey-13'"
    >
      {{ message }}
    </p>
    <button
      v-if="retryText"
      type="button"
      class="shrink-0 text-label1 font-medium transition-colors duration-150"
      :class="variant === 'dark'
        ? 'rounded-lg bg-grey-1 px-3 py-1.5 text-grey-13 active:bg-grey-4'
        : 'px-1 text-primary active:text-green-active'"
      @click="emit('retry')"
    >
      {{ retryText }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string // 줄바꿈(\n) 가능
  retryText?: string // 빈 문자열이면 버튼 숨김
  variant?: 'dark' | 'light'
}

withDefaults(defineProps<Props>(), {
  retryText: '다시 시도',
  variant: 'dark',
})

const emit = defineEmits<{ retry: [] }>()
</script>

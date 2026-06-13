<template>
  <button
    type="button"
    class="shrink-0 transition-colors duration-150 flex items-center justify-center"
    :class="variant === 'radio'
      ? ['w-5 h-5 rounded-full', modelValue ? 'bg-primary' : 'border-2 border-grey-5 bg-white']
      : ['w-6 h-6', modelValue ? 'text-primary' : 'text-grey-6']"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <!-- 라디오: 흰 점 -->
    <span v-if="variant === 'radio' && modelValue" class="w-2 h-2 rounded-full bg-white" />
    <!-- 체크박스: 체크 아이콘 (미선택 grey-6 / 선택 primary) -->
    <svg v-else-if="variant !== 'radio'" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5L10 17L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  variant?: 'check' | 'radio'
}>(), { variant: 'check' })

defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

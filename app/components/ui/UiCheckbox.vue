<template>
  <button
    type="button"
    class="shrink-0 rounded-full transition-colors duration-150 flex items-center justify-center"
    :class="[
      variant === 'radio' ? 'w-5 h-5' : 'w-6 h-6',
      modelValue ? 'bg-primary' : 'border-2 border-grey-5 bg-white',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <!-- 라디오: 흰 점 -->
    <span v-if="variant === 'radio' && modelValue" class="w-2 h-2 rounded-full bg-white" />
    <!-- 체크박스: 체크 SVG -->
    <svg v-else-if="variant !== 'radio' && modelValue" width="12" height="9" viewBox="0 0 12 9" fill="none">
      <path d="M1 4L4.5 7.5L11 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
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

<template>
  <button
    class="flex items-center gap-2 font-semibold transition-colors duration-150 rounded-xl"
    :class="[sizeClasses, variantClasses, props.justify === 'start' ? 'justify-start' : 'justify-center']"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'lg' | 'md' | 'sm'
  justify?: 'center' | 'start'
  disabled?: boolean
  loading?: boolean
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'lg',
  justify: 'center',
  disabled: false,
  loading: false,
  active: false,
})

// H:56 / padding:16 / radius:12 (Figma 기준)
const sizeClasses = computed(() => {
  if (props.size === 'lg') return 'w-full h-14 px-4 text-[16px]'
  if (props.size === 'md') return 'w-full h-12 px-4 text-[15px]'
  return 'px-4 h-8 text-[14px]'
})

const variantClasses = computed(() => {
  if (props.disabled || props.loading) {
    return 'bg-grey-4 text-grey-6 cursor-not-allowed'
  }
  if (props.variant === 'primary') {
    return 'bg-primary text-white active:bg-green-active'
  }
  if (props.variant === 'secondary') {
    // 선택 칩 active 상태: Green/Light 배경 + Primary 1px 보더
    return props.active
      ? 'bg-green-light border border-primary text-grey-13'
      : 'bg-grey-3 text-grey-13 border border-transparent'
  }
  if (props.variant === 'ghost') {
    return 'bg-transparent text-primary underline'
  }
  return ''
})
</script>

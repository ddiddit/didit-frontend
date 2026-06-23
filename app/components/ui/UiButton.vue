<template>
  <button
    class="flex items-center gap-2 transition-colors duration-150 rounded-xl"
    :class="[sizeClasses, variantClasses, props.justify === 'start' ? 'justify-start' : 'justify-center']"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'chip' | 'ghost'
  size?: 'lg' | 'md' | 'sm'
  justify?: 'center' | 'start'
  disabled?: boolean
  loading?: boolean
  active?: boolean
  muted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'lg',
  justify: 'center',
  disabled: false,
  loading: false,
  active: false,
  muted: false,
})

// H:56 / padding:16 / radius:12 (Figma 기준)
const sizeClasses = computed(() => {
  if (props.size === 'lg') return 'w-full h-14 px-4 text-body2'
  if (props.size === 'md') return 'w-full h-[50px] px-4 text-body3'
  return 'px-4 h-8 text-[14px]'
})

const variantClasses = computed(() => {
  if (props.disabled || props.loading) {
    return 'font-semibold bg-grey-5 text-grey-6 cursor-not-allowed'
  }
  if (props.variant === 'primary') {
    return 'font-semibold bg-primary text-grey-13 active:bg-green-active'
  }
  if (props.variant === 'secondary') {
    // 전체 동의 등 토글 버튼: 기본 grey-3 배경
    return props.active
      ? 'font-bold bg-green-light border border-primary text-grey-13'
      : 'font-normal bg-grey-3 text-grey-13 border border-transparent'
  }
  if (props.variant === 'chip') {
    // 직군·나이대·연차 등 선택 칩: font-weight 변경은 transition 안 되므로 즉시 반응
    if (props.active) return 'transition-none font-semibold bg-green-light border border-primary text-grey-13'
    if (props.muted) return 'transition-none font-normal bg-white text-grey-6 border border-grey-5'
    return 'transition-none font-normal bg-white text-grey-13 border border-grey-5'
  }
  if (props.variant === 'ghost') {
    return 'font-medium bg-transparent text-primary underline'
  }
  return ''
})
</script>

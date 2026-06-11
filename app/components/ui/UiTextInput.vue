<template>
  <div>
    <!-- 라벨 -->
    <div v-if="label" class="flex items-center gap-1 mb-2">
      <span class="text-label1 font-medium text-grey-13">{{ label }}</span>
      <svg v-if="success" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 mb-[2px]">
        <path d="M14.9138 4.00094L5.44384 13.4709L1.08984 8.39394L2.60784 7.09094L5.55584 10.5309L13.4998 2.58594L14.9138 4.00094Z" fill="#3DDB99"/>
      </svg>
    </div>

    <!-- 인풋 컨테이너: 배경·보더는 여기에, 인풋은 absolute로 채움 -->
    <div
      class="relative h-[56px] rounded-xl border transition-colors"
      :class="containerClasses"
    >
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :disabled="disabled"
        class="absolute inset-0 bg-transparent pl-4 text-body3 font-medium text-grey-13 outline-none disabled:text-grey-6 placeholder:text-grey-7 placeholder:font-normal"
        :class="rightPadding"
        v-bind="$attrs"
        @input="onInput"
        @focus="focused = true"
        @blur="onBlur"
      />

      <!-- 우측: 클리어 버튼 + 글자 수 -->
      <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
        <button
          v-if="clearable && modelValue.length > 0 && !disabled"
          type="button"
          class="pointer-events-auto"
          @mousedown.prevent
          @click="onClear"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0">
              <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3ZM12 10.9551L9.04492 8L8 9.04492L10.9551 12L8 14.9551L9.04492 16L12 13.0449L14.9551 16L16 14.9551L13.0449 12L16 9.04492L14.9551 8L12 10.9551Z" fill="#C6C6C6"/>
            </svg>
        </button>
        <span v-if="showCount && maxlength !== undefined" class="text-caption1 font-medium text-grey-7 tabular-nums">
          {{ modelValue.length }}/{{ maxlength }}
        </span>
      </div>
    </div>

    <!-- 힌트 / 에러 텍스트 -->
    <p
      v-if="error || hint"
      class="mt-2 text-caption1 font-medium"
      :class="error ? 'text-red-500' : 'text-grey-7'"
    >
      {{ error || hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  maxlength?: number
  hint?: string
  error?: string
  success?: boolean
  clearable?: boolean
  showCount?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCount: true,
  clearable: false,
  disabled: false,
  success: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  clear: []
}>()

const focused = ref(false)

// 컨테이너 배경·보더 (인풋 자체는 bg-transparent)
const containerClasses = computed(() => {
  if (props.disabled) return 'bg-grey-4 border-transparent'
  if (props.error) return 'bg-grey-3 border-red-500'
  if (focused.value) return 'bg-grey-3 border-primary'
  return 'bg-grey-3 border-transparent'
})

// 우측 요소 너비에 맞게 인풋 오른쪽 패딩 조정
const rightPadding = computed(() => {
  const hasClear = props.clearable && props.modelValue.length > 0 && !props.disabled
  const hasCount = props.showCount && props.maxlength !== undefined
  if (hasClear && hasCount) return 'pr-[80px]'
  if (hasClear || hasCount) return 'pr-[44px]'
  return 'pr-4'
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onBlur() {
  focused.value = false
  emit('blur')
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

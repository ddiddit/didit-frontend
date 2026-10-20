<template>
  <!-- 회고 결과·상세 공용 탭: 기본(회고 결과) / 메모 -->
  <div class="flex shrink-0 border-b border-grey-5">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="flex-1 text-center pb-[10px] pt-3 text-[16px] font-semibold leading-[150%] tracking-[-0.02em] transition-colors relative"
      :class="modelValue === tab.key ? 'text-grey-13' : 'text-grey-7'"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        v-if="modelValue === tab.key"
        class="absolute -bottom-px left-0 right-0 h-[2px] bg-grey-13"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
export type RetrospectTab = 'basic' | 'memo'

defineProps<{ modelValue: RetrospectTab }>()
defineEmits<{ 'update:modelValue': [value: RetrospectTab] }>()

const tabs: { key: RetrospectTab; label: string }[] = [
  { key: 'basic', label: '기본' },
  { key: 'memo', label: '메모' },
]
</script>

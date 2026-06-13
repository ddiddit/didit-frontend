<template>
  <button
    type="button"
    class="relative inline-flex shrink-0 items-center w-10 h-6 rounded-full transition-colors duration-200"
    :class="modelValue ? 'bg-primary' : 'bg-grey-4'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"
      :class="modelValue ? 'translate-x-4' : 'translate-x-0'"
      style="box-shadow: 0 1px 4px rgba(0,0,0,0.1)"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

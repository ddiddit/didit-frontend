<template>
  <div class="flex gap-1.5">
    <div
      v-for="i in total"
      :key="i"
      class="flex-1 h-1 rounded-full transition-colors duration-300"
      :class="i <= current ? 'bg-primary' : 'bg-grey-4'"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  current: number
  total?: number
}>(), {
  total: 3,
})
</script>

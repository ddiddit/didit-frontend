<template>
  <span
    class="inline-flex items-center gap-1 rounded-[6px] text-[11px] font-semibold leading-[130%] tracking-[-0.02em]"
    :class="[colors.bg, colors.text]"
    style="padding: 4px 6px;"
  >
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
type TagColor = 'green' | 'pink' | 'blue' | 'orange' | 'purple' | 'yellow' | 'red' | 'leaf-green' | 'sky-blue' | 'brown'

const props = withDefaults(defineProps<{
  color?: TagColor
  text?: string
}>(), {
  color: 'green',
})

const colorMap: Record<TagColor, { bg: string; text: string }> = {
  'green':      { bg: 'bg-tag-green-light',            text: 'text-tag-green' },
  'pink':       { bg: 'bg-tag-pink-light',             text: 'text-tag-pink' },
  'blue':       { bg: 'bg-tag-blue-light',             text: 'text-tag-blue' },
  'orange':     { bg: 'bg-tag-orange-light',           text: 'text-tag-orange' },
  'purple':     { bg: 'bg-tag-purple-light',           text: 'text-tag-purple' },
  'yellow':     { bg: 'bg-tag-yellow-light',           text: 'text-tag-yellow' },
  'red':        { bg: 'bg-tag-red-light',              text: 'text-tag-red' },
  'leaf-green': { bg: 'bg-tag-leaf-green-light',       text: 'text-tag-leaf-green' },
  'sky-blue':   { bg: 'bg-tag-sky-blue-light',         text: 'text-tag-sky-blue' },
  'brown':      { bg: 'bg-tag-brown-light',            text: 'text-tag-brown' },
}

const colors = computed(() => colorMap[props.color])
</script>

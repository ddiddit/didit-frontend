<template>
  <div class="relative shrink-0" :style="`height:${totalH}px;width:${width}px`">
    <!-- 선택 영역 상하 구분선 -->
    <div class="absolute inset-x-0 h-px bg-grey-4 pointer-events-none z-10"
         :style="`top:${padH}px`" />
    <div class="absolute inset-x-0 h-px bg-grey-4 pointer-events-none z-10"
         :style="`bottom:${padH}px`" />
    <!-- 스크롤 영역 (fade 마스크) -->
    <div
      class="h-full"
      style="mask-image:linear-gradient(to bottom,transparent 0%,black 28%,black 72%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 28%,black 72%,transparent 100%);"
    >
      <div
        ref="el"
        class="h-full overflow-y-scroll scrollbar-hide"
        style="scroll-snap-type:y mandatory;"
        @scroll="onScroll"
      >
        <div :style="`height:${padH}px`" />
        <div
          v-for="(item, i) in extItems"
          :key="`${i}-${item.value}`"
          :style="`height:${rowH}px;scroll-snap-align:center;scroll-snap-stop:always`"
          class="flex items-center justify-center"
        >
          <span
            class="inline-block font-semibold text-[20px] leading-none transition-all duration-150"
            :class="activeExtIdx === i ? 'text-grey-13' : Math.abs(activeExtIdx - i) === 1 ? 'text-grey-6' : 'text-grey-4'"
            :style="{
              transform: activeExtIdx === i
                ? 'scale(1)'
                : Math.abs(activeExtIdx - i) === 1
                  ? 'scale(0.75)'
                  : 'scale(0.60)',
            }"
          >{{ item.label }}</span>
        </div>
        <div :style="`height:${padH}px`" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Item { value: string | number; label: string }

const props = withDefaults(defineProps<{
  modelValue: string | number
  items: Item[]
  rowH?: number
  visibleRows?: number
  width?: number
  loop?: boolean
}>(), { rowH: 40, visibleRows: 5, width: 72, loop: false })

const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()

const el = ref<HTMLElement | null>(null)
const sel = ref(0)           // 실제 인덱스 (0 ~ items.length-1)
const activeExtIdx = ref(0)  // 현재 스크롤 위치 (확장 인덱스)

const padH = computed(() => props.rowH * Math.floor(props.visibleRows / 2))
const totalH = computed(() => props.rowH * props.visibleRows)

const extItems = computed(() =>
  props.loop
    ? [...props.items, ...props.items, ...props.items]
    : props.items
)

function getExtIdx(realIdx: number): number {
  return props.loop ? realIdx + props.items.length : realIdx
}

let timer: ReturnType<typeof setTimeout> | null = null
let isScrolling = false

function goTo(extIdx: number) {
  el.value?.scrollTo({ top: extIdx * props.rowH, behavior: 'instant' })
}

watch(() => props.modelValue, (v) => {
  if (isScrolling) return
  const i = props.items.findIndex(x => x.value === v)
  if (i >= 0 && i !== sel.value) {
    sel.value = i
    const ei = getExtIdx(i)
    activeExtIdx.value = ei
    nextTick(() => goTo(ei))
  }
}, { immediate: true })

onMounted(() => {
  const i = props.items.findIndex(x => x.value === props.modelValue)
  if (i >= 0) {
    sel.value = i
    const ei = getExtIdx(i)
    activeExtIdx.value = ei
    setTimeout(() => goTo(ei), 16)
  }
})

function onScroll() {
  if (!el.value) return
  isScrolling = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    isScrolling = false
    if (!el.value) return
    const extIdx = Math.max(
      0,
      Math.min(Math.round(el.value.scrollTop / props.rowH), extItems.value.length - 1),
    )
    activeExtIdx.value = extIdx
    const realIdx = props.loop
      ? ((extIdx % props.items.length) + props.items.length) % props.items.length
      : Math.max(0, Math.min(extIdx, props.items.length - 1))
    if (realIdx !== sel.value) {
      sel.value = realIdx
      emit('update:modelValue', props.items[realIdx].value)
    }
  }, 80)
}
</script>

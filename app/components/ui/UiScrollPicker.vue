<template>
  <div class="relative shrink-0" :style="`height:${totalH}px;width:${width}px`">
    <!-- 위·아래 그라데이션 페이드 (박스 안에서 흐려짐, 바깥으로 넘치지 않음) -->
    <div
      class="h-full"
      style="mask-image:linear-gradient(to bottom,transparent 0%,black 60%,black 30%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 26%,black 74%,transparent 100%);"
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
          class="flex items-center justify-center"
          :style="rowStyle(i)"
        >
          <span
            class="inline-block font-semibold text-[20px] leading-none transition-colors duration-100"
            :class="Math.abs(rowDist(i)) < 0.5 ? 'text-grey-13' : 'text-grey-6'"
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
}>(), { rowH: 27, visibleRows: 7, width: 72, loop: false })

const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()

const el = ref<HTMLElement | null>(null)
const sel = ref(0) // 실제 인덱스 (0 ~ items.length-1)
const scrollTop = ref(0) // 현재 스크롤 위치 (곡면 계산용, 매 프레임 갱신)

const padH = computed(() => props.rowH * Math.floor(props.visibleRows / 2))
const totalH = computed(() => props.rowH * props.visibleRows)

const extItems = computed(() =>
  props.loop
    ? [...props.items, ...props.items, ...props.items]
    : props.items,
)

function getExtIdx(realIdx: number): number {
  return props.loop ? realIdx + props.items.length : realIdx
}

// 각 줄을 가운데에서 떨어진 거리(줄 단위)에 따라 가운데로 모으고(translateY) 높이를 눌러(scaleY)
// 원통형 곡면처럼 보이게 한다. (스크롤에 따라 연속적으로 갱신)
const UNIT_ANGLE = 26 // 줄당 회전각(도)
// 가운데에서 떨어진 거리(줄 단위) — 색상/곡면 계산 공용
function rowDist(i: number): number {
  const rowCenter = padH.value + i * props.rowH + props.rowH / 2
  const viewCenter = scrollTop.value + totalH.value / 2
  return (rowCenter - viewCenter) / props.rowH
}
function rowStyle(i: number) {
  const dist = rowDist(i)
  const ad = Math.abs(dist)
  const delta = (UNIT_ANGLE * Math.PI) / 180
  const theta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, dist * delta))
  const radius = props.rowH / delta
  const translateY = radius * Math.sin(theta) - dist * props.rowH
  const scaleY = Math.max(0.05, Math.cos(theta))
  // 가운데에서 멀어질수록 더 연하게 (부드러운 그라데이션)
  const opacity = 1 / (1 + ad * 0.6)
  return {
    height: `${props.rowH}px`,
    scrollSnapAlign: 'center',
    scrollSnapStop: 'always',
    transform: `translateY(${translateY}px) scaleY(${scaleY})`,
    opacity,
    willChange: 'transform, opacity',
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
let isScrolling = false
let rafId: number | null = null
let ready = false // 초기 위치가 잡히기 전까지 emit 차단(전환 중 0으로 덮어쓰는 것 방지)

function goTo(extIdx: number) {
  el.value?.scrollTo({ top: extIdx * props.rowH, behavior: 'instant' })
  scrollTop.value = extIdx * props.rowH
}

watch(() => props.modelValue, (v) => {
  if (isScrolling) return
  const i = props.items.findIndex(x => x.value === v)
  if (i >= 0 && i !== sel.value) {
    sel.value = i
    nextTick(() => goTo(getExtIdx(i)))
  }
}, { immediate: true })

onMounted(() => {
  const i = props.items.findIndex(x => x.value === props.modelValue)
  if (i < 0) {
    ready = true
    return
  }
  sel.value = i
  const target = getExtIdx(i)
  // 바텀시트 슬라이드 전환 중에는 스크롤이 바로 안 잡힐 수 있어, 실제 위치가 목표에 닿을 때까지 재시도한다.
  let tries = 0
  const place = () => {
    if (!el.value) return
    goTo(target)
    tries += 1
    if (Math.abs(el.value.scrollTop - target * props.rowH) > 1 && tries < 30) {
      requestAnimationFrame(place)
    } else {
      ready = true
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(place))
})

function onScroll() {
  if (!el.value) return
  isScrolling = true
  if (rafId == null) {
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (el.value) scrollTop.value = el.value.scrollTop
    })
  }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    isScrolling = false
    if (!el.value || !ready) return
    const extIdx = Math.max(
      0,
      Math.min(Math.round(el.value.scrollTop / props.rowH), extItems.value.length - 1),
    )
    const realIdx = props.loop
      ? ((extIdx % props.items.length) + props.items.length) % props.items.length
      : Math.max(0, Math.min(extIdx, props.items.length - 1))
    if (realIdx !== sel.value) {
      sel.value = realIdx
      emit('update:modelValue', props.items[realIdx].value)
    }
    // 무한 루프: 가장자리 복제본에 닿으면 같은 값이 가운데 오도록 가운데 복제본으로 조용히 재배치한다.
    if (props.loop) {
      const middleExt = realIdx + props.items.length
      if (extIdx !== middleExt) nextTick(() => goTo(middleExt))
    }
  }, 80)
}
</script>

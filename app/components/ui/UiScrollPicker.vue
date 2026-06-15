<template>
  <div class="relative shrink-0" :style="`height:${totalH}px;width:${width}px`">
    <!-- 위·아래 그라데이션 페이드 -->
    <div
      class="h-full"
      style="mask-image:linear-gradient(to bottom,transparent 0%,black 26%,black 74%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 26%,black 74%,transparent 100%);"
    >
      <div
        ref="el"
        class="h-full overflow-y-scroll scrollbar-hide select-none"
        style="scroll-snap-type:y mandatory;will-change:scroll-position;touch-action:pan-y;overscroll-behavior:contain;"
        @scroll="onScroll"
        @scrollend="onScrollEnd"
      >
        <div :style="`height:${padH}px`" />
        <div
          v-for="(item, i) in extItems"
          :key="`${i}-${item.value}`"
          class="flex items-center justify-center"
          :style="rowStyles[i]"
        >
          <span
            class="inline-block font-semibold text-[20px] leading-none"
            :class="rowIsCenter[i] ? 'text-grey-13' : 'text-grey-6'"
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
const sel = ref(0)
const scrollTop = ref(0)

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

const UNIT_ANGLE = 26
const DELTA = (UNIT_ANGLE * Math.PI) / 180

// 스타일·중앙여부를 한번에 계산해 템플릿에서 rowDist를 중복 호출하지 않음
const rowStyles = computed(() => {
  const st = scrollTop.value
  const ph = padH.value
  const rh = props.rowH
  const th = totalH.value
  const r = rh / DELTA
  const vh = th / 2

  return extItems.value.map((_, i) => {
    const dist = (ph + i * rh + rh / 2 - st - vh) / rh
    // 가시 범위 밖 항목은 3D 계산 생략 (그라데이션 마스크로 보이지 않음)
    if (Math.abs(dist) > 3) {
      return { height: `${rh}px`, scrollSnapAlign: 'center', scrollSnapStop: 'always' as const }
    }
    const theta = Math.max(-1.5708, Math.min(1.5708, dist * DELTA))
    // 정수 픽셀로 반올림 → 소수점 위치로 인한 텍스트 블러 방지
    const ty = Math.round(r * Math.sin(theta) - dist * rh)
    const angle = Math.round(theta * 57.2958)
    return {
      height: `${rh}px`,
      scrollSnapAlign: 'center',
      scrollSnapStop: 'always' as const,
      transform: `perspective(600px) translateY(${ty}px) rotateX(${angle}deg)`,
    }
  })
})

const rowIsCenter = computed(() => {
  const st = scrollTop.value
  const ph = padH.value
  const rh = props.rowH
  const vh = totalH.value / 2
  return extItems.value.map((_, i) => {
    const dist = (ph + i * rh + rh / 2 - st - vh) / rh
    return Math.abs(dist) < 0.5
  })
})

let rafId: number | null = null
let fallbackTimer: ReturnType<typeof setTimeout> | null = null
let isScrolling = false
let ready = false

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
  if (i < 0) { ready = true; return }
  sel.value = i
  const target = getExtIdx(i)
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
  // scrollend 미지원 브라우저용 폴백
  if (fallbackTimer) clearTimeout(fallbackTimer)
  fallbackTimer = setTimeout(onScrollEnd, 150)
}

function onScrollEnd() {
  if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
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

  // 무한 루프: 가장자리 복제본에 닿으면 가운데 복제본으로 조용히 재배치
  if (props.loop) {
    const middleExt = realIdx + props.items.length
    if (extIdx !== middleExt) goTo(middleExt)
  }
}
</script>

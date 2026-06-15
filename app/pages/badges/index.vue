<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">목표 달성 배지</span>
      <div class="w-6 h-6" />
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- 안내 배너 (radius 16, padding 24/18) -->
      <div class="px-5 pt-3 pb-4">
        <div class="rounded-2xl bg-grey-3 px-6 py-[18px] flex items-center justify-center">
          <span class="text-[14px] font-normal leading-[140%] tracking-[-0.02em] text-grey-13 text-center">나만의 회고 배지를 모아보세요!</span>
        </div>
      </div>

      <!-- 최근에 획득한 배지 (획득 배지가 있을 때만 구분선과 함께 표시) -->
      <template v-if="recentBadge">
        <!-- 배너 pb-4(16) + pt-1(4) = 20px 간격으로 피그마 맞춤 -->
        <div class="px-5 pt-1 flex flex-col items-center gap-1">
          <img :src="recentBadge.image" :alt="recentBadge.name" class="h-[132px] object-contain" />
          <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-7 text-center">최근에 획득한 배지</p>
          <p class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13 text-center">{{ recentBadge.name }}</p>
        </div>
        <!-- 구분선: 텍스트에서 34px 아래 -->
        <div class="mx-5 mt-[34px] h-px bg-[#EEEEEE]" />
      </template>

      <!-- 배지 그리드 (2열, 가로간격 22 / 세로간격 34) -->
      <!-- 최근 배지 섹션이 없을 때는 상단 여백을 줄여 피그마와 맞춤 -->
      <div :class="['px-5 pb-10 grid grid-cols-2 gap-x-[22px] gap-y-[34px]', recentBadge ? 'pt-6' : 'pt-1']">
        <button
          v-for="badge in badges"
          :key="badge.code"
          class="flex flex-col items-center gap-1"
          @click="openSheet(badge)"
        >
          <!-- 이미지 영역 164×120 -->
          <div v-if="badge.acquired" class="w-full h-[120px] flex items-center justify-center">
            <img :src="badge.image" :alt="badge.name" class="max-h-[120px] max-w-full object-contain" />
          </div>
          <div v-else class="w-full h-[120px] flex items-center justify-center">
            <div class="w-[140px] h-[90px] rounded-[14px] border-[1.4px] border-dashed border-grey-6 bg-white flex items-center justify-center">
              <img src="/icons/lock.svg" alt="잠금" class="w-[25px] h-[25px]" />
            </div>
          </div>
          <!-- 텍스트 프레임: 이름↔설명 gap 1px -->
          <div class="flex flex-col w-full gap-px">
            <p class="text-[14px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13 text-center">{{ badge.name }}</p>
            <p class="text-[13px] font-normal leading-[150%] tracking-[-0.02em] text-grey-8 text-center">{{ badge.description }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- 배지 상세 바텀시트 (회고 기록 피커와 동일 컨테이너) -->
    <Teleport to="#app-container">
      <Transition name="sheet-fade">
        <div
          v-if="selected"
          class="absolute inset-0 z-20 bg-black/40"
          @click="closeSheet"
        />
      </Transition>
      <Transition name="sheet-slide">
        <div
          v-if="selected"
          class="absolute left-5 right-5 z-30"
          style="bottom: 30px;"
          @click.stop
        >
          <div
            class="relative w-full h-[316px] bg-grey-1 rounded-[36px] overflow-hidden flex flex-col items-center pt-[50px]"
            :style="dragStyle"
            @transitionend="onSheetTransitionEnd"
          >
            <!-- 드래그 핸들 -->
            <div class="absolute top-[10px] left-1/2 -translate-x-1/2 w-[50px] h-[5px] rounded-full bg-grey-5" />
            <!-- 드래그해서 닫기 영역 -->
            <div
              class="absolute top-0 left-0 right-0 h-16 z-10 touch-none cursor-grab active:cursor-grabbing"
              @pointerdown="onDragStart"
              @pointermove="onDragMove"
              @pointerup="onDragEnd"
              @pointercancel="onDragEnd"
            />

            <!-- 배지 이미지 영역 (획득: 배지이미지 / 미획득: 잠금 박스) -->
            <div class="w-full flex justify-center items-center h-[144px]">
              <img
                v-if="selected.acquired"
                :src="selected.image"
                :alt="selected.name"
                class="h-full object-contain"
              />
              <div
                v-else
                class="w-[168px] h-[108px] rounded-[14px] border-[1.4px] border-dashed border-grey-6 bg-white flex items-center justify-center"
              >
                <img src="/icons/lock.svg" alt="잠금" class="w-[25px] h-[25px]" />
              </div>
            </div>

            <!-- 텍스트 영역 (피그마: 276px 너비, gap 6px) -->
            <div class="flex flex-col items-center gap-1.5 mt-6 max-w-[276px] w-full">
              <!-- 이름 + 진행 칩 (미획득·countable일 때) -->
              <div class="flex items-center gap-2">
                <p class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13">{{ selected.name }}</p>
                <span
                  v-if="selected.countable && !selected.acquired"
                  class="flex items-center gap-px rounded-[5px] bg-grey-4 px-[5px] h-5"
                >
                  <span class="text-[12px] font-semibold leading-[136%] tracking-[-0.02em] text-grey-12">{{ selected.current }}</span>
                  <span class="text-[12px] font-semibold leading-[136%] tracking-[-0.02em] text-grey-7">/{{ selected.goal }}</span>
                </span>
              </div>
              <!-- 획득 날짜 또는 안내 문구 -->
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8 text-center">
                {{ selected.acquired ? formatAcquiredDate(selected.acquiredAt) : selected.unlockText }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { BadgeView } from '~/composables/useBadges'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })

const { badges, recentBadge, load } = useBadges()

const selected = ref<BadgeView | null>(null)

// 드래그해서 닫기
const dragY = ref(0)
const dragging = ref(false)
let dragStartY = 0
let closingByDrag = false

const dragStyle = computed(() => {
  if (!dragging.value && dragY.value === 0) return {}
  return {
    transform: `translateY(${dragY.value}px)`,
    transition: dragging.value ? 'none' : 'transform 0.25s ease',
  }
})

function onDragStart(e: PointerEvent) {
  dragging.value = true
  dragStartY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onDragMove(e: PointerEvent) {
  if (!dragging.value) return
  dragY.value = Math.max(0, e.clientY - dragStartY)
}
function onDragEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (dragY.value > 90) {
    closingByDrag = true
    dragY.value = 700
  } else {
    dragY.value = 0
  }
}
function onSheetTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  if (closingByDrag) {
    closingByDrag = false
    selected.value = null
  }
}

function openSheet(badge: BadgeView) {
  dragY.value = 0
  selected.value = badge
}

function closeSheet() {
  selected.value = null
}

function formatAcquiredDate(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} 획득`
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.sheet-fade-enter-active { transition: opacity 0.22s ease; }
.sheet-fade-leave-active { transition: opacity 0.25s ease; }
.sheet-fade-enter-from,
.sheet-fade-leave-to    { opacity: 0; }

.sheet-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.15s ease; }
.sheet-slide-leave-active { transition: transform 0.2s ease-in; }
.sheet-slide-enter-from   { transform: translateY(120%); opacity: 0; }
.sheet-slide-leave-to     { transform: translateY(120%); }
</style>

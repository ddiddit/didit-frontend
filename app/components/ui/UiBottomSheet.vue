<template>
  <Teleport to="#app-container">
    <Transition name="sheet-fade">
      <div v-if="modelValue" class="absolute inset-0 z-40 bg-black/40" @click="close" />
    </Transition>
    <Transition name="sheet-slide">
      <div v-if="modelValue" class="absolute left-5 right-5 z-50" style="bottom: 30px">
        <div
          ref="sheetEl"
          class="relative bg-grey-1 rounded-[36px] flex flex-col items-center gap-6 pt-8 pb-5 px-5"
          :style="{
            transform: dragY > 0 ? `translateY(${dragY}px)` : '',
            transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
          }"
        >
          <!-- 드래그 핸들 영역 (상단을 끌어내려 닫기) -->
          <div
            class="absolute top-0 left-0 right-0 h-16 z-10 cursor-grab active:cursor-grabbing"
            @mousedown="onDown"
            @touchstart.passive="onDown"
          />
          <div class="w-[50px] h-1 rounded-[5px] bg-grey-5" />
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const sheetEl = ref<HTMLElement | null>(null)
const dragY = ref(0) // 아래로 끌린 거리
const dragging = ref(false)
let startY = 0

function close() {
  emit('update:modelValue', false)
}

function pointY(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0
  return e.clientY
}

function onDown(e: MouseEvent | TouchEvent) {
  dragging.value = true
  startY = pointY(e)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onUp)
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return
  if (e.cancelable && 'touches' in e) e.preventDefault()
  dragY.value = Math.max(0, pointY(e) - startY) // 아래로만 따라감
}

function onUp(e: MouseEvent | TouchEvent) {
  removeListeners()
  dragging.value = false
  const dragged = pointY(e) - startY
  dragY.value = 0
  if (dragged > 90) close() // 임계값 이상 끌면 닫기, 아니면 스냅백
}

function removeListeners() {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onUp)
}

onUnmounted(removeListeners)
</script>

<style scoped>
.sheet-fade-enter-active { transition: opacity 0.25s ease; }
.sheet-fade-leave-active { transition: opacity 0.2s ease; }
.sheet-fade-enter-from,
.sheet-fade-leave-to { opacity: 0; }

.sheet-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease; }
.sheet-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.22s ease; }
.sheet-slide-enter-from,
.sheet-slide-leave-to { transform: translateY(120%); opacity: 0; }
</style>

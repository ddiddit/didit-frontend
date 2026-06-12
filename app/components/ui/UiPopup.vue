<template>
  <Teleport to="#app-container">
    <Transition name="popup-fade">
      <div v-if="modelValue" class="absolute inset-0 z-50 flex items-center justify-center px-5">
        <div
          class="absolute inset-0 bg-black/40"
          @click="closeOnBackdrop && $emit('update:modelValue', false)"
        />
        <div class="relative w-full max-w-[300px] mx-auto bg-grey-1 rounded-2xl pt-5 px-4 pb-4">
          <!-- 텍스트 영역 -->
          <div class="flex flex-col items-center gap-1 mb-[14px]">
            <p class="w-full text-[17px] font-semibold text-grey-13 text-center" style="line-height:140%">{{ title }}</p>
            <p
              v-if="description"
              class="w-full text-[14px] font-normal text-grey-8 text-center"
              style="line-height:160%"
            >{{ description }}</p>
          </div>
          <!-- 버튼 영역 -->
          <div class="flex gap-2">
            <button
              v-if="showCancel !== false"
              class="flex-1 h-[50px] rounded-xl border border-grey-5 bg-grey-1 text-[15px] font-normal text-grey-13 active:bg-grey-3 transition-colors"
              @click="$emit('update:modelValue', false); $emit('cancel')"
            >{{ cancelText ?? '취소' }}</button>
            <button
              class="flex-1 h-[50px] rounded-xl text-[15px] font-normal transition-opacity active:opacity-80 disabled:opacity-60"
              :class="variant === 'destructive' ? 'bg-error text-grey-1' : 'bg-primary text-grey-13'"
              :disabled="loading"
              @click="$emit('confirm')"
            >{{ confirmText ?? '확인' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'confirm' | 'destructive'
  showCancel?: boolean
  loading?: boolean
  closeOnBackdrop?: boolean
}>(), {
  variant: 'confirm',
  showCancel: true,
  loading: false,
  closeOnBackdrop: true,
})

defineEmits<{
  'update:modelValue': [v: boolean]
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.popup-fade-enter-active { transition: opacity 0.2s ease; }
.popup-fade-leave-active { transition: opacity 0.15s ease; }
.popup-fade-enter-from, .popup-fade-leave-to { opacity: 0; }
</style>

<template>
  <!-- 메모 입력 박스 — 작성한 내용만큼 높이가 늘어나고, 내용이 있을 때만 '저장' 노출 -->
  <div class="bg-grey-3 rounded-xl p-4 flex flex-col gap-2">
    <textarea
      ref="textarea"
      v-model="input"
      rows="1"
      placeholder="메모를 자유롭게 작성해 보세요"
      class="w-full resize-none bg-transparent outline-none text-body3-reading text-grey-13 placeholder:text-grey-7"
    />
    <div v-if="input.trim() || cancelable" class="flex justify-end gap-4">
      <button v-if="cancelable" class="text-label2 font-semibold text-grey-7" :disabled="saving" @click="$emit('cancel')">
        취소
      </button>
      <button
        v-if="input.trim()"
        class="text-label2 font-semibold text-green-hover disabled:opacity-50"
        :disabled="saving"
        @click="$emit('save', input.trim())"
      >
        저장
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'

const props = withDefaults(defineProps<{ initial?: string; saving?: boolean; cancelable?: boolean; autofocus?: boolean }>(), {
  initial: '',
  saving: false,
  cancelable: false,
  autofocus: false,
})
defineEmits<{ save: [content: string]; cancel: [] }>()

const { textarea, input } = useTextareaAutosize({ input: props.initial })

// 저장 성공 후 새 메모 입력창 비우기용
function clear() {
  input.value = ''
}
defineExpose({ clear })

onMounted(() => {
  if (props.autofocus) textarea.value?.focus()
})
</script>

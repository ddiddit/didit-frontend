<template>
  <div class="retro_user_message self-end flex flex-col items-end">
    <div class="user_message_box max-w-[350px] box-border p-[11px] bg-grey-13 rounded-[24px] text-grey-1 text-[14px] leading-[22px] overflow-hidden flex flex-col">
      <span ref="textRef" class="user_message_text break-words is-clamped">{{ text }}</span>

      <!-- 8줄을 넘겨 잘린 경우에만 노출 — 말풍선(검은 영역) 안에 포함 -->
      <button
        v-if="overflowing"
        type="button"
        class="mt-[8px] self-end text-[12px] text-grey-5 flex items-center"
        @click="showFull = true"
      >
        <span class="inline-block mt-[1px]">전체 보기</span>
        <img src="/icons/chevron-right.svg" alt="" class="w-4 h-4" />
      </button>
    </div>

    <!-- 전체 보기 팝업 — 헤더에 뒤로가기만, 배경 흰색 / 글자 검은색 -->
    <Teleport to="#app-container">
      <Transition name="full-fade">
        <div
          v-if="showFull"
          class="full_view absolute inset-0 z-50 bg-white flex flex-col"
          style="padding-bottom: env(safe-area-inset-bottom, 0px)"
        >
          <div class="full_view_header px-[20px] flex items-center h-[50px] shrink-0">
            <button type="button" aria-label="뒤로" @click="showFull = false">
              <img src="/icons/back.svg" alt="뒤로" class="w-5 h-5" />
            </button>
          </div>
          <div class="full_view_body flex-1 overflow-y-auto px-[20px] pb-[24px]">
            <p class="text-[14px] leading-[22px] text-grey-13 whitespace-pre-line break-words">{{ text }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ text: string }>()

  // 한 줄 높이(px) — .user_message_text 의 leading-[22px] 와 일치
  const LINE_HEIGHT = 22
  // 최대 표시 줄 수 (line-clamp 값과 일치)
  const MAX_LINES = 8
  const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES

  const textRef = ref<HTMLElement | null>(null)
  const overflowing = ref(false) // 8줄을 실제로 넘겼는지
  const showFull = ref(false) // 전체 보기 팝업 열림 여부

  // 클램프를 잠깐 해제한 상태로 전체 높이를 재서 "잘렸는지" 판정
  function checkOverflow() {
    const el = textRef.value
    if (!el) return

    const saved = el.style.cssText
    el.style.display = 'block'
    el.style.setProperty('-webkit-line-clamp', 'unset')
    el.style.maxHeight = 'none'
    const fullHeight = el.scrollHeight
    el.style.cssText = saved

    overflowing.value = fullHeight > MAX_HEIGHT + 1
  }

  onMounted(() => nextTick(checkOverflow))
  // 본문이 바뀌면(재사용 등) 다시 판정
  watch(() => props.text, () => nextTick(checkOverflow))
  // 가로 폭이 바뀌면 줄 수가 달라지므로 재판정
  useEventListener(window, 'resize', useThrottleFn(checkOverflow, 150))
</script>

<style scoped>
  .user_message_text {
    overflow-wrap: break-word;
  }
  /* 접힌 상태에서만 8줄로 클램프 (마지막 줄 … 처리) */
  .user_message_text.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 8;
    line-clamp: 8;
    /* line-clamp 미지원/스트립 시에도 콘텐츠 박스 안에서만 잘리도록 하드 캡 (8줄 * 22px) */
    max-height: 176px;
    overflow: hidden;
  }

  /* 전체 보기 팝업 페이드 */
  .full-fade-enter-active { transition: opacity 0.2s ease; }
  .full-fade-leave-active { transition: opacity 0.15s ease; }
  .full-fade-enter-from,
  .full-fade-leave-to { opacity: 0; }
</style>

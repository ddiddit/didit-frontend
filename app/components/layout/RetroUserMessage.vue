<template>
  <div class="retro_user_message self-end flex flex-col items-end gap-[8px]">
    <!-- 전송된 첨부 — 이미지는 썸네일, 그 외엔 형식 배지+파일명. 서버가 삭제를 권고한 첨부만 ×로 삭제됨 -->
    <div v-if="attachments && attachments.length" class="flex flex-wrap gap-[8px] justify-end">
      <div
        v-for="a in attachments"
        :key="a.attachmentId"
        role="button"
        tabindex="0"
        :aria-label="`첨부파일 ${a.filename} 열기`"
        class="relative w-[104px] h-[124px] rounded-[16px] overflow-hidden shrink-0 bg-grey-9 bg-cover bg-center cursor-pointer"
        :style="a.previewUrl ? { backgroundImage: `url(${a.previewUrl})` } : undefined"
        @click="openDetail(a)"
        @keydown.enter="openDetail(a)"
      >
        <span
          v-if="!a.previewUrl"
          class="absolute top-[8px] left-[8px] px-[6px] py-[2px] rounded-[6px] bg-grey-1 text-grey-13 text-[10px] font-semibold"
        >{{ extLabel(a.filename) }}</span>

        <button
          type="button"
          aria-label="첨부파일 삭제"
          class="absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-grey-1/70 flex items-center justify-center text-grey-13 text-[12px] leading-none"
          @click.stop="emit('deleteAttachment', a.attachmentId)"
        >×</button>

        <p
          v-if="!a.previewUrl"
          class="absolute bottom-[8px] left-[8px] right-[8px] text-[11px] text-grey-1 leading-[1.3] break-all"
          style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden;"
        >{{ a.filename }}</p>
      </div>
    </div>

    <div class="user_message_box max-w-[350px] box-border p-[11px] bg-grey-13 rounded-[24px] text-grey-1 text-[14px] leading-[22px] overflow-hidden flex flex-col">
      <span ref="textRef" class="user_message_text break-words is-clamped">{{ text }}</span>

      <!-- 7줄을 넘겨 잘린 경우에만 노출 — 말풍선(검은 영역) 안에 포함 -->
      <button
        v-if="overflowing"
        type="button"
        class="mt-[8px] self-end text-[12px] text-grey-5 flex items-center"
        @click="showFull = true"
      >
        <span class="inline-block mt-[1px]">전체보기</span>
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

    <!-- 첨부파일 상세보기 모달 — 이미지는 바로 보여주고, 그 외(PDF/TXT/MD)는 iframe으로 미리보기 -->
    <Teleport to="#app-container">
      <Transition name="full-fade">
        <div
          v-if="detailAttachment"
          class="full_view absolute inset-0 z-50 bg-white flex flex-col"
          style="padding-bottom: env(safe-area-inset-bottom, 0px)"
        >
          <div class="full_view_header px-[20px] flex items-center justify-between h-[50px] shrink-0">
            <button type="button" aria-label="닫기" @click="closeDetail">
              <img src="/icons/back.svg" alt="닫기" class="w-5 h-5" />
            </button>
            <span class="text-[14px] text-grey-8 truncate max-w-[220px]">{{ detailAttachment.filename }}</span>
            <span class="w-5 h-5" />
          </div>
          <div class="flex-1 flex items-center justify-center overflow-hidden bg-grey-3">
            <span v-if="detailLoading" class="w-[28px] h-[28px] rounded-full border-[3px] border-grey-6/40 border-t-grey-8 animate-spin" />
            <img
              v-else-if="detailUrl && isImageFilename(detailAttachment.filename)"
              :src="detailUrl"
              :alt="detailAttachment.filename"
              class="max-w-full max-h-full object-contain"
            />
            <iframe v-else-if="detailUrl" :src="detailUrl" class="w-full h-full border-0" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import type { SentAttachment } from '~/utils/attachment'

  const props = defineProps<{ text: string; attachments?: SentAttachment[]; retrospectiveId: string }>()
  const emit = defineEmits<{ deleteAttachment: [attachmentId: string] }>()

  const retro = useRetrospect()
  const { show } = useToast()

  // 카드에 표시할 확장자 배지 문구 (예: "PDF")
  function extLabel(filename: string): string {
    return filename.slice(filename.lastIndexOf('.') + 1).toUpperCase()
  }

  // 확장자로 이미지인지 판정 — 모달에서 <img>로 보여줄지 <iframe>으로 보여줄지 결정
  function isImageFilename(filename: string): boolean {
    const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png'
  }

  // 상세보기 모달 상태
  const detailAttachment = ref<SentAttachment | null>(null) // 열려있는 첨부 (null이면 모달 닫힘)
  const detailUrl = ref<string | null>(null) // 발급받은 상세보기 URL
  const detailLoading = ref(false)

  // 카드 클릭 → 모달을 바로 열고, 그 안에서 상세보기 URL을 새로 발급받는다
  // (만료 시각이 있는 presigned URL이라 캐싱해두면 나중에 열 때 깨질 수 있어 매번 새로 받음)
  async function openDetail(a: SentAttachment) {
    detailAttachment.value = a
    detailUrl.value = null
    detailLoading.value = true
    try {
      const { url } = await retro.getAttachmentDownloadUrl(props.retrospectiveId, a.attachmentId)
      detailUrl.value = url
    } catch (err) {
      console.log(err)
      show('첨부파일을 열지 못했어요. 잠시 후 다시 시도해주세요.')
      detailAttachment.value = null
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail() {
    detailAttachment.value = null
    detailUrl.value = null
  }

  // 한 줄 높이(px) — .user_message_text 의 leading-[22px] 와 일치
  const LINE_HEIGHT = 22
  // 최대 표시 줄 수 (line-clamp 값과 일치)
  const MAX_LINES = 7
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
  /* 접힌 상태에서만 7줄로 클램프 (마지막 줄 … 처리) */
  .user_message_text.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 7;
    line-clamp: 7;
    /* line-clamp 미지원/스트립 시에도 콘텐츠 박스 안에서만 잘리도록 하드 캡 (7줄 * 22px) */
    max-height: 154px;
    overflow: hidden;
  }

  /* 전체 보기 팝업 페이드 */
  .full-fade-enter-active { transition: opacity 0.2s ease; }
  .full-fade-leave-active { transition: opacity 0.15s ease; }
  .full-fade-enter-from,
  .full-fade-leave-to { opacity: 0; }
</style>

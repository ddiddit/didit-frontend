<template>
    <div class="flex flex-col gap-[8px] mx-[16px]">
        <!-- 첨부파일 카드 — 이미지는 썸네일 자체, 그 외엔 형식 배지+파일명. 업로드 중엔 스피너 -->
        <div v-if="attachments.length" class="flex flex-wrap gap-[8px]">
            <div
              v-for="a in attachments"
              :key="a.id"
              role="button"
              tabindex="0"
              :aria-label="`첨부파일 ${a.file.name} 미리보기`"
              class="relative w-[104px] h-[124px] rounded-[16px] overflow-hidden shrink-0 bg-grey-9 bg-cover bg-center cursor-pointer"
              :style="a.previewUrl ? { backgroundImage: `url(${a.previewUrl})` } : undefined"
              @click="openPreview(a)"
              @keydown.enter="openPreview(a)"
            >
                <!-- 파일 형식 배지 (이미지는 썸네일로 이미 구분되니 생략) -->
                <span
                  v-if="!a.previewUrl"
                  class="absolute top-[8px] left-[8px] px-[6px] py-[2px] rounded-[6px] bg-grey-1 text-grey-13 text-[10px] font-semibold"
                >{{ attachmentExtLabel(a.file) }}</span>

                <!-- 제거 버튼 -->
                <button
                  type="button"
                  aria-label="첨부 제거"
                  class="absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-grey-1/70 flex items-center justify-center text-grey-13 text-[12px] leading-none"
                  @click.stop="removeAttachment(a.id)"
                >×</button>

                <!-- 업로드 중 스피너 / 실패 표시 -->
                <div v-if="a.status === 'uploading'" class="absolute inset-0 flex items-center justify-center">
                  <span class="w-[28px] h-[28px] rounded-full border-[3px] border-grey-1/30 border-t-grey-1 animate-spin" />
                </div>
                <div v-else-if="a.status === 'error'" class="absolute inset-0 flex items-center justify-center">
                  <span class="text-[11px] text-grey-1 font-semibold">실패</span>
                </div>

                <!-- 파일명 (이미지는 썸네일이 곧 미리보기라 생략) — 3줄까지, 그 이상은 말줄임표 -->
                <p
                  v-if="!a.previewUrl"
                  class="absolute bottom-[8px] left-[8px] right-[8px] text-[11px] text-grey-1 leading-[1.3] break-all"
                  style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden;"
                >{{ a.file.name }}</p>
            </div>
        </div>

        <div class="retro__input p-[10px] box-border border border-grey-4 bg-grey-4 rounded-[24px] flex" :class="[isWrapped ? 'items-end' : 'items-center', disabled ? 'opacity-50' : '']">
            <button class="w-[24px] h-[24px] flex justify-center items-center shrink-0" :class="isWrapped ? 'mb-[2px]' : ''" :disabled="disabled || !retrospectiveId || attachments.length >= MAX_ATTACHMENT_COUNT" @click="fileInputRef?.click()">
                <img src="/icons/attach_file.png" alt="첨부파일" />
            </button>
            <input ref="fileInputRef" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.txt,.md" class="hidden" @change="handleFileChange" />
            <textarea @input="handleTextareaChange" @keydown="handleKeydown" ref="textRef" :value="textareaValue" :disabled="disabled" rows="1" class="resize-none outline-none bg-transparent flex-1 mx-[6px]" />
            <button class="shrink-0" :class="isWrapped ? 'mb-[2px]' : ''" :disabled="disabled" @click="emit('accessMic')">
                <img src="/icons/voice.svg" alt="마이크접근" />
            </button>
        </div>

        <!-- 전송 전 첨부 미리보기 모달 — 이미지는 바로 보여주고, 그 외(PDF/TXT/MD)는 iframe으로 미리보기 -->
        <Teleport to="#app-container">
          <Transition name="preview-fade">
            <div
              v-if="previewAttachment"
              class="absolute inset-0 z-50 bg-white flex flex-col"
              style="padding-bottom: env(safe-area-inset-bottom, 0px)"
            >
              <div class="px-[20px] flex items-center justify-between h-[50px] shrink-0">
                <button type="button" aria-label="닫기" @click="closePreview">
                  <img src="/icons/back.svg" alt="닫기" class="w-5 h-5" />
                </button>
                <span class="text-[14px] text-grey-8 truncate max-w-[220px]">{{ previewAttachment.file.name }}</span>
                <span class="w-5 h-5" />
              </div>
              <div class="flex-1 flex items-center justify-center overflow-hidden bg-grey-3">
                <img
                  v-if="previewUrl && isImageAttachment(previewAttachment.file)"
                  :src="previewUrl"
                  :alt="previewAttachment.file.name"
                  class="max-w-full max-h-full object-contain"
                />
                <iframe v-else-if="previewUrl" :src="previewUrl" class="w-full h-full border-0" />
              </div>
            </div>
          </Transition>
        </Teleport>
    </div>
</template>
<style scoped>
.preview-fade-enter-active { transition: opacity 0.2s ease; }
.preview-fade-leave-active { transition: opacity 0.15s ease; }
.preview-fade-enter-from,
.preview-fade-leave-to { opacity: 0; }
</style>
<script setup lang="ts">
  import { useRetrospect } from '@/composables/useRetrospect'
  import {
    isSupportedAttachment,
    isImageAttachment,
    attachmentExtLabel,
    resolveContentType,
    sha256Base64,
    MAX_ATTACHMENT_SIZE,
    MAX_ATTACHMENT_COUNT,
  } from '~/utils/attachment'
  import type { SentAttachment } from '~/utils/attachment'

  // retrospective 액션
  const retro = useRetrospect()
  const { show } = useToast()

  // disabled: AI 메시지 타이핑 중 등 — 첨부·마이크·전송을 모두 잠근다
  const props = defineProps<{ disabled?: boolean; retrospectiveId: string }>()

  // Textarea Value
  const textareaValue = ref<string>('')

  // Textarea DOM
  const textRef = ref<HTMLTextAreaElement | null>(null)

  // 두 줄 이상으로 넘어갔는지 — 버튼 정렬(아래쪽 도킹 vs 중앙 정렬)에만 쓰는 값.
  // textarea는 position을 바꾸지 않고 계속 평범한 flex 아이템으로 있어서, 이 값이 폭에는
  // 영향을 주지 않는다 — 그래서 "폭이 판정 결과에 따라 바뀌어 판정이 다시 뒤집히는" 진동이나,
  // "버튼 자리를 위해 얼마나 여백을 더 줘야 하는지"를 계산해서 맞춰야 하는 문제 자체가 없다.
  // (행이 가장 큰 자식인 textarea 높이에 맞춰 자동으로 늘어나고, 버튼은 items-end로 바닥에 붙는다 —
  //  전부 브라우저 flex 레이아웃이 계산해줘서 우리가 여백을 추측하다 어긋나는 버그가 날 수 없다)
  const isWrapped = ref<boolean>(false)

  // 부모(start.vue)에 답변 제출·마이크 접근 요청을 알림 — 채팅 반영·API 호출·권한 처리는 부모 책임
  const emit = defineEmits<{ send: [content: string, attachments: SentAttachment[]]; accessMic: [] }>()

  // Enter로 전송 (Shift+Enter는 줄바꿈, 한글 조합 확정 Enter는 무시)
  function handleKeydown(e: KeyboardEvent) {
    if (props.disabled || e.key !== 'Enter' || e.shiftKey || e.isComposing) return
    e.preventDefault() // 기본 동작(줄바꿈) 삽입을 막아야 하므로 동기적으로 먼저 호출

    const content = textareaValue.value.trim()
    if (attachments.value.some(a => a.status === 'uploading')) {
      show('첨부파일 업로드가 끝나면 보낼 수 있어요.')
      return
    }

    const sentAttachments: SentAttachment[] = attachments.value
      .filter(a => a.status === 'done' && a.attachmentId)
      .map(a => ({ attachmentId: a.attachmentId as string, filename: a.file.name, previewUrl: a.previewUrl }))
    // 텍스트가 없어도 완료된 첨부가 하나라도 있으면 보낼 수 있다 (첨부만 보내는 답변)
    if (!content && sentAttachments.length === 0) return

    emit('send', content, sentAttachments)

    textareaValue.value = ''
    // previewUrl은 여기서 revoke하지 않는다 — 전송된 말풍선에서도 같은 썸네일을 계속 보여주기 위함
    // (사용자가 다시 선택해서 revoke하지 않고 넘어간 것은 끝까지 살아있다 — 세션 내 몇 개 정도는 무해)
    attachments.value = []
    resetTextarea()
  }

  // 전송 후 입력창을 처음 상태(한 줄)로 되돌린다
  function resetTextarea() {
    isWrapped.value = false
    const el = textRef.value
    if (el) el.style.height = '24px'
  }

  const handleTextareaChange = (e: Event) => {
    textareaValue.value = (e.target as HTMLTextAreaElement).value
    syncHeight()
  }

  // height를 auto로 풀고 다시 재서 "지금 실제로 필요한 높이"를 구한다
  // (풀지 않고 재면 이전에 고정해둔 높이가 그대로 나와서, 두 줄→한 줄로 줄어들 때 반영이 안 됨)
  // textarea가 flex 흐름 안에 그대로 있어서(position 안 바뀜), 이 높이가 늘어나면
  // 부모 .retro__input도 자동으로 같이 늘어난다 — 컨테이너 높이를 따로 계산해서 맞출 필요가 없다
  function syncHeight() {
    const el = textRef.value
    if (!el) return
    el.style.height = 'auto'
    const naturalHeight = el.scrollHeight
    el.style.height = `${naturalHeight}px`
    isWrapped.value = naturalHeight > 24
  }

  // 음성 레코더(부모가 연다)가 STT로 변환한 텍스트를 초안으로 받아온다. 기존 입력이 있으면 뒤에 이어붙인다.
  const voiceTranscript = useState<string>('retrospect:voice-transcript', () => '')
  watch(voiceTranscript, (t) => {
    if (!t) return
    textareaValue.value = textareaValue.value ? `${textareaValue.value} ${t}` : t
    voiceTranscript.value = '' // 1회성 채널 — 소비 후 비운다
    nextTick(() => {
      syncHeight()
      textRef.value?.focus()
    })
  })

  // 선택된 첨부파일 하나의 업로드 상태
  interface Attachment {
    id: string // 로컬 식별자(칩 key/제거용) — 서버 attachmentId와는 별개
    file: File
    status: 'uploading' | 'done' | 'error'
    attachmentId?: string // 발급된 첨부 id — 'done'일 때만 존재, answer() 제출에 사용
    previewUrl?: string // 이미지일 때만 — 로컬 미리보기용 object URL, 다 쓰면 반드시 revoke
  }
  const attachments = ref<Attachment[]>([])
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // 업로드 중인 요청을 취소하기 위한 AbortController — 반응형일 필요 없어 ref/reactive 밖에 둔다.
  // 로컬 id(Attachment.id) 기준으로 관리 (서버 attachmentId는 발급 전까지 없음)
  const uploadControllers = new Map<string, AbortController>()

  // 파일 선택 — 지원 포맷(jpg/png/pdf/txt/md)·용량(10MB)·개수(최대 3개)를 검증하고 업로드를 시작한다
  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = '' // 같은 파일을 다시 선택할 수 있도록 리셋

    const remaining = MAX_ATTACHMENT_COUNT - attachments.value.length
    if (remaining <= 0) {
      show(`첨부파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 보낼 수 있어요.`)
      return
    }
    if (files.length > remaining) {
      show(`첨부파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 보낼 수 있어요.`)
    }

    for (const file of files.slice(0, remaining)) {
      if (!isSupportedAttachment(file)) {
        show('지원하지 않는 파일 형식이에요. (JPG, PNG, PDF, TXT, MD)')
        continue
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        show('파일당 최대 10MB까지 첨부할 수 있어요.')
        continue
      }
      uploadAttachment(file)
    }
  }

  // 첨부 하나를 업로드: 체크섬 계산 → 업로드 URL 발급 → 발급받은 URL로 파일 본문 PUT → 업로드 완료 확인
  async function uploadAttachment(file: File) {
    // reactive()로 감싸지 않으면 push 이후 entry.status를 mutate해도 화면(칩)이 갱신되지 않는다
    // (push된 배열 안의 객체는 별도의 반응형 proxy로 감싸지는데, 여기서 들고 있는 entry는 원본
    // 객체 그대로라 이후 대입이 proxy의 set을 안 거쳐서 반응성 트리거가 안 됨)
    const entry = reactive<Attachment>({
      id: crypto.randomUUID(),
      file,
      status: 'uploading',
      previewUrl: isImageAttachment(file) ? URL.createObjectURL(file) : undefined,
    })
    attachments.value.push(entry)

    // 업로드 중 삭제(×)하면 이 컨트롤러로 진행 중인 요청(발급/PUT/완료 확인)을 전부 취소한다
    const controller = new AbortController()
    uploadControllers.set(entry.id, controller)

    try {
      const contentType = resolveContentType(file)
      const checksumSha256 = await sha256Base64(file)
      const { attachmentId, uploadUrl } = await retro.generateURL(
        props.retrospectiveId,
        { filename: file.name, contentType, size: file.size, checksumSha256 },
        controller.signal,
      )

      // Content-Length는 fetch가 body(File)로부터 자동 계산해 보내므로(직접 지정 불가한 forbidden
      // 헤더) 여기서 따로 설정하지 않아도 file.size와 동일하게 나간다.
      await $fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
          'x-amz-checksum-sha256': checksumSha256,
        },
        signal: controller.signal,
      })

      // S3 PUT 성공만으로는 서버가 모르므로, 완료 API로 uploadStatus를 확정해야 answer() 제출에 쓸 수 있다
      const completed = await retro.completeUpload(props.retrospectiveId, attachmentId, controller.signal)
      if (completed.uploadStatus !== 'UPLOADED') throw new Error(`unexpected uploadStatus: ${completed.uploadStatus}`)

      entry.status = 'done'
      entry.attachmentId = attachmentId
    } catch (err) {
      // 사용자가 직접 삭제(×)해서 취소된 경우엔 이미 목록에서 빠졌으니 에러 표시할 필요가 없다
      if (isAbortError(err)) return
      console.warn('[attachment] 업로드 실패:', err)
      entry.status = 'error'
      show('첨부파일을 업로드하지 못했어요. 다시 시도해 주세요.')
    } finally {
      uploadControllers.delete(entry.id)
    }
  }

  // fetch(AbortError)·axios(ERR_CANCELED) 양쪽의 취소 에러를 모두 인식
  function isAbortError(err: unknown): boolean {
    if (!(err instanceof Error)) return false
    return err.name === 'AbortError' || err.name === 'CanceledError' || (err as { code?: string }).code === 'ERR_CANCELED'
  }

  // 첨부 제거 — 업로드 중이면 진행 중인 요청부터 취소하고, 목록에서 뺀다
  // (전송 전 첨부는 응답에 안 실리므로 서버에 뭔가 남았어도 무해)
  function removeAttachment(id: string) {
    uploadControllers.get(id)?.abort()
    uploadControllers.delete(id)

    const target = attachments.value.find(a => a.id === id)
    if (target) revokeAttachmentPreview(target)
    attachments.value = attachments.value.filter(a => a.id !== id)
  }

  // 이미지 미리보기로 만든 object URL은 브라우저가 자동으로 안 정리해주므로 직접 revoke해야 한다
  function revokeAttachmentPreview(a: Attachment) {
    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
  }

  // 전송 전 첨부 미리보기 모달 상태 — 서버 호출 없이 로컬 File을 그대로 보여준다
  const previewAttachment = ref<Attachment | null>(null)
  const previewUrl = ref<string | null>(null)
  let previewUrlIsTemp = false // true면 미리보기 전용으로 새로 만든 objectURL이라 닫을 때 revoke해야 함

  // 카드 클릭 → 이미지면 이미 있는 previewUrl을 그대로 쓰고, 그 외(PDF/TXT/MD)는 미리보기용 objectURL을 즉석에서 만든다
  function openPreview(a: Attachment) {
    previewAttachment.value = a
    if (a.previewUrl) {
      previewUrl.value = a.previewUrl
      previewUrlIsTemp = false
    } else {
      previewUrl.value = URL.createObjectURL(a.file)
      previewUrlIsTemp = true
    }
  }

  function closePreview() {
    if (previewUrlIsTemp && previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewAttachment.value = null
    previewUrl.value = null
    previewUrlIsTemp = false
  }

  // 전송 없이 화면을 떠나는 경우(뒤로가기 등)에도 진행 중인 업로드를 취소하고 미리보기 URL을 정리
  onUnmounted(() => {
    uploadControllers.forEach(c => c.abort())
    uploadControllers.clear()
    attachments.value.forEach(revokeAttachmentPreview)
    if (previewUrlIsTemp && previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  })
</script>

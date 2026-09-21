<template>
    <div class="flex flex-col gap-[8px] mx-[16px]">
        <!-- 첨부파일 칩 — 업로드 중/완료/실패 상태 표시, 완료 전에도 제거 가능 -->
        <div v-if="attachments.length" class="flex flex-wrap gap-[6px]">
            <div
              v-for="a in attachments"
              :key="a.id"
              class="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[16px] bg-grey-4 text-[12px] text-grey-9 max-w-[220px]"
            >
                <span class="truncate">{{ a.file.name }}</span>
                <span v-if="a.status === 'uploading'" class="text-grey-6 shrink-0">업로드 중···</span>
                <span v-else-if="a.status === 'error'" class="text-danger shrink-0">실패</span>
                <button type="button" class="shrink-0 text-grey-6" aria-label="첨부 제거" @click="removeAttachment(a.id)">×</button>
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
    </div>
</template>
<style scoped>
</style>
<script setup lang="ts">
  import { useRetrospect } from '@/composables/useRetrospect'
  import {
    isSupportedAttachment,
    resolveContentType,
    sha256Base64,
    MAX_ATTACHMENT_SIZE,
    MAX_ATTACHMENT_COUNT,
  } from '~/utils/attachment'

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
  const emit = defineEmits<{ send: [content: string, attachmentIds: string[]]; accessMic: [] }>()

  // Enter로 전송 (Shift+Enter는 줄바꿈, 한글 조합 확정 Enter는 무시)
  function handleKeydown(e: KeyboardEvent) {
    if (props.disabled || e.key !== 'Enter' || e.shiftKey || e.isComposing) return
    e.preventDefault() // 기본 동작(줄바꿈) 삽입을 막아야 하므로 동기적으로 먼저 호출

    const content = textareaValue.value.trim()
    if (!content) return
    if (attachments.value.some(a => a.status === 'uploading')) {
      show('첨부파일 업로드가 끝나면 보낼 수 있어요.')
      return
    }

    const attachmentIds = attachments.value
      .filter(a => a.status === 'done' && a.attachmentId)
      .map(a => a.attachmentId as string)
    emit('send', content, attachmentIds)

    textareaValue.value = ''
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
  }
  const attachments = ref<Attachment[]>([])
  const fileInputRef = ref<HTMLInputElement | null>(null)

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

  // 첨부 하나를 업로드: 체크섬 계산 → 업로드 URL 발급 → 발급받은 URL로 파일 본문 PUT
  async function uploadAttachment(file: File) {
    const entry: Attachment = { id: crypto.randomUUID(), file, status: 'uploading' }
    attachments.value.push(entry)

    try {
      const contentType = resolveContentType(file)
      const checksumSha256 = await sha256Base64(file)
      const { attachmentId, uploadUrl } = await retro.generateURL(props.retrospectiveId, {
        filename: file.name,
        contentType,
        size: file.size,
        checksumSha256,
      })

      // Content-Length는 fetch가 body(File)로부터 자동 계산해 보내므로(직접 지정 불가한 forbidden
      // 헤더) 여기서 따로 설정하지 않아도 file.size와 동일하게 나간다.
      await $fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
          'x-amz-checksum-sha256': checksumSha256,
        },
      })

      entry.status = 'done'
      entry.attachmentId = attachmentId
    } catch (err) {
      console.warn('[attachment] 업로드 실패:', err)
      entry.status = 'error'
      show('첨부파일을 업로드하지 못했어요. 다시 시도해 주세요.')
    }
  }

  // 첨부 제거 — 업로드 중이어도 그냥 목록에서 빼기만 한다(응답에 안 실리므로 서버에 남아도 무해)
  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter(a => a.id !== id)
  }

</script>

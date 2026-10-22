import type {
  ApiResponse,
  StartRetrospectiveResponse,
  SubmitAnswerResponse,
  TranscribeResponse,
  DeepQuestionResponse,
  CompleteRetrospectiveResponse,
  RetrospectiveDetail,
  ConversationResponse,
  FinishRetrospectiveResponse,
  RetrospectiveResultResponse,
  UploadURL,
  AnswerGuide,
  AssistantAction,
  UploadUrlRequest,
  AttachmentComplete,
  AttachmentDownloadUrl,
  RetrospectiveMemo,
} from '~/types/api'
import { toUploadableAudio } from '~/utils/audio'
import { CACHE_KEYS, removePersistedCache } from '~/utils/persisted-cache'
import { createAnalyticsInsertId } from '~/analytics/events'

// 회고 진행 플로우 API 레이어.
// 대부분 mutation 성격이라 캐싱하지 않고, AI 생성(완료/심화질문/STT)은
// 기본 10초 타임아웃으로 부족할 수 있어 요청별로 더 길게 설정한다.
// 백엔드 RestClient 읽기 타임아웃(60초)보다 약간 길게 둬서, 서버가 먼저 끊고
// 정상 에러 응답(problem+json)을 주도록 한다(클라이언트가 먼저 abort하지 않게).
export const AI_TIMEOUT = 65_000

// 진행 중인 회고 id를 저장하는 localStorage 키.
// 답변 도중 화면을 나갔다 들어와도(뒤로가기·앱 재시작 등) start()를 다시 호출해 새 회고를
// 만들지 않고, 이 id로 대화 조회부터 시도해 이어서 진행하기 위함.
export const ACTIVE_RETROSPECTIVE_KEY = 'activeRetrospectiveId'
export const COMPLETING_RETROSPECTIVE_KEY = 'completingRetrospectiveId'

export function saveCompletingRetrospective(id: string) {
  try {
    localStorage.setItem(COMPLETING_RETROSPECTIVE_KEY, id)
  }
  catch {
    // 메모리 상태로 현재 흐름은 계속 진행한다.
  }
}

export function readCompletingRetrospective(): string | null {
  try {
    return localStorage.getItem(COMPLETING_RETROSPECTIVE_KEY)
  }
  catch {
    return null
  }
}

export function clearCompletingRetrospective() {
  try {
    localStorage.removeItem(COMPLETING_RETROSPECTIVE_KEY)
  }
  catch {
    // 분석 복구용 상태 정리 실패는 사용자 흐름과 분리한다.
  }
}

// 진행 중 회고의 '마지막 AI 메시지' 캐시 — 재진입 때마다 대화 조회(/conversation)를 다시 요청하지 않고 바로 복구하기 위함.
// 대화는 이 앱에서 보낸 답변으로만 바뀌므로, AI 메시지를 화면에 띄울 때 저장하고 답변을 보내는 순간 지운다.
// (답변 후 응답을 못 받고 나간 경우엔 캐시가 없어 서버에서 새로 조회 → 놓친 AI 응답도 복구된다)
const ACTIVE_CONVERSATION_CACHE_KEY = 'activeConversationCache'

export interface ConversationCache {
  retrospectiveId: string
  message: { id: string; title?: string | null; body?: string | null; content?: string | null; answerGuide?: AnswerGuide | null }
  readyToComplete: boolean
  action?: AssistantAction | null // 답변 응답의 action — OFFER_COMPLETION/CONFIRM_COMPLETION이면 선택 UI도 복구
}

export function saveConversationCache(cache: ConversationCache) {
  try {
    localStorage.setItem(ACTIVE_CONVERSATION_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // 저장소 접근 불가 — 다음 진입 때 서버 조회로 복구
  }
}

export function readConversationCache(retrospectiveId: string): ConversationCache | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CONVERSATION_CACHE_KEY)
    const cache = raw ? (JSON.parse(raw) as ConversationCache) : null
    return cache?.retrospectiveId === retrospectiveId ? cache : null
  } catch {
    return null
  }
}

export function clearConversationCache() {
  localStorage.removeItem(ACTIVE_CONVERSATION_CACHE_KEY)
}

// 진행 중 회고 정리 — 재개용 id와 대화 캐시를 함께 지운다(대화 종료·나가기·유효하지 않은 id)
export function clearActiveRetrospective() {
  localStorage.removeItem(ACTIVE_RETROSPECTIVE_KEY)
  clearConversationCache()
}

export function useRetrospect() {
  const { $api } = useNuxtApp()
  const { trackEvent } = useAmplitude()

  // 홈(최근 회고·오늘 횟수·미션)·프로필(레벨·배지)에 영향을 주는 작업 뒤 호출 — 캐시를 지워 다음 진입 때 새로 받게 한다
  function invalidateDerivedCaches({ profile = false } = {}) {
    removePersistedCache(CACHE_KEYS.home)
    if (profile) invalidateProfileCache()
  }

  // 회고 시작 → 첫 질문 반환
  async function start(): Promise<StartRetrospectiveResponse> {
    const res = await $api.post<ApiResponse<StartRetrospectiveResponse>>('/api/v2/retrospectives')
    return res.data.data
  }

  // 텍스트/첨부 답변 제출 → 다음 질문 또는 완료 준비 신호.
  // 첨부만 보내는 경우 content는 비워도 되는데, 이때 서버는 content/inputType 필드 자체가
  // 없는 요청을 기대하므로(빈 문자열이 아니라) content가 없으면 두 필드를 통째로 뺀다.
  async function answer(id: string, content: string, attachmentIds: string[] = []): Promise<SubmitAnswerResponse> {
    const trimmed = content.trim()
    const res = await $api.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/v2/retrospectives/${id}/messages`,
      {
        // 메시지마다 고유해야 하는 멱등성 키. 회고 id를 그대로 쓰면 같은 회고의 두 번째
        // 메시지부터 서버가 중복 제출로 보고 409를 반환한다.
        clientMessageId: crypto.randomUUID(),
        ...(trimmed ? { content: trimmed, inputType: 'TEXT' } : {}),
        attachmentIds,
      },
    )
    return res.data.data
  }

  // 대화 조회 — 앱 재진입이나 AI 응답 실패 후 현재 메시지·턴 상태 복구용
  async function getConversation(id: string): Promise<ConversationResponse> {
    const res = await $api.get<ApiResponse<ConversationResponse>>(
      `/api/v2/retrospectives/${id}/conversation`,
    )
    return res.data.data
  }

  // 대화 종료 — 종료와 동시에 확인된 대화 내용을 구조화해 결과(title/result)를 생성한다.
  // 생성된 결과는 getResult()로 조회한다.
  // 이미 완료된 회고에 다시 요청해도 멱등하게 처리되고,
  // 생성 실패 상태였다면 재요청으로 생성 상태를 복구해 재시도할 수 있다.
  // readyToComplete(=skippable)인 질문에서 "회고 마치기"를 눌렀을 때 사용.
  async function finish(id: string): Promise<FinishRetrospectiveResponse> {
    const res = await $api.post<ApiResponse<FinishRetrospectiveResponse>>(
      `/api/v2/retrospectives/${id}/finish`,
      undefined,
      // 종료와 동시에 AI 결과를 생성하므로 기본 10초로는 부족하다
      { timeout: AI_TIMEOUT },
    )
    invalidateDerivedCaches({ profile: true })
    return res.data.data
  }

  // v2 회고 결과 조회 — finish()로 생성된 제목·결과(요약·강점·개선점 등)를 받아온다
  async function getResult(id: string): Promise<RetrospectiveResultResponse> {
    const res = await $api.get<ApiResponse<RetrospectiveResultResponse>>(
      `/api/v2/retrospectives/${id}/result`,
    )
    return res.data.data
  }

  // 음성 답변 제출(STT 포함) → 변환 텍스트 + 다음 질문 (앱 전용)
  async function answerByVoice(id: string, file: Blob): Promise<SubmitAnswerResponse> {
    const { blob, filename } = await toUploadableAudio(file)
    const form = new FormData()
    form.append('file', blob, filename)
    const res = await $api.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/v1/retrospectives/${id}/answers/voice`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: AI_TIMEOUT },
    )
    return res.data.data
  }

  // 음성 → 텍스트 변환만 (전송 전 미리보기, 앱 전용)
  async function transcribe(id: string, file: Blob): Promise<string> {
    const { blob, filename } = await toUploadableAudio(file)
    const form = new FormData()
    form.append('file', blob, filename)
    const res = await $api.post<ApiResponse<TranscribeResponse>>(
      `/api/v1/retrospectives/${id}/answers/voice/transcribe`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: AI_TIMEOUT },
    )
    return res.data.data.content
  }

  // AI 심화질문 조회 (생성 대기 중이면 isReady=false)
  async function getDeepQuestion(id: string): Promise<DeepQuestionResponse> {
    const res = await $api.get<ApiResponse<DeepQuestionResponse>>(
      `/api/v1/retrospectives/${id}/deep-question`,
      { timeout: AI_TIMEOUT },
    )
    return res.data.data
  }

  // 다시 시작 → 기존 회고 삭제 후 새 회고 시작 (첫 질문 반환). 하루 횟수 정책 적용됨.
  async function restart(id: string): Promise<StartRetrospectiveResponse> {
    try {
      const res = await $api.post<ApiResponse<StartRetrospectiveResponse>>(
        `/api/v1/retrospectives/${id}/restart`,
      )
      trackEvent(
        'retrospect_restarted',
        {
          previous_retrospective_id: id,
          retrospective_id: res.data.data.retrospectiveId,
        },
        createAnalyticsInsertId('retrospect_restarted', id, res.data.data.retrospectiveId),
      )
      return res.data.data
    }
    catch (error) {
      trackEvent('retrospect_restart_failed', {
        previous_retrospective_id: id,
        reason: 'request_failed',
      })
      throw error
    }
  }

  // 진행 중 회고 나가기 (PENDING이면 삭제, 그 외 유지). 베스트에포트.
  async function exit(id: string): Promise<void> {
    await $api.post(`/api/v1/retrospectives/${id}/exit`)
  }

  // 회고 완료 → AI 제목/요약 생성
  async function complete(id: string): Promise<CompleteRetrospectiveResponse> {
    const res = await $api.post<ApiResponse<CompleteRetrospectiveResponse>>(
      `/api/v1/retrospectives/${id}/complete`,
      undefined,
      { timeout: AI_TIMEOUT },
    )
    invalidateDerivedCaches({ profile: true })
    return res.data.data
  }

  // 회고 상세 조회 (완료된 회고, v2: 프로젝트/태그 포함)
  async function getDetail(id: string): Promise<RetrospectiveDetail> {
    const res = await $api.get<ApiResponse<RetrospectiveDetail>>(`/api/v2/retrospectives/${id}`)
    return res.data.data
  }

  // 회고 저장 → 제목 확정 + COMPLETED 전환 (요약 생성 완료 상태에서만 가능)
  async function save(id: string, title: string): Promise<RetrospectiveDetail> {
    const res = await $api.post<ApiResponse<RetrospectiveDetail>>(
      `/api/v1/retrospectives/${id}/save`,
      { title },
    )
    invalidateDerivedCaches({ profile: true })
    return res.data.data
  }

  // 회고 삭제 (soft delete)
  async function remove(id: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}`)
    invalidateDerivedCaches({ profile: true })
  }

  // 회고 제목 수정 (저장된 회고, 최대 25자)
  async function updateTitle(id: string, title: string): Promise<void> {
    await $api.patch(`/api/v1/retrospectives/${id}/title`, { title })
    invalidateDerivedCaches()
  }

  // 프로젝트 지정 / 해제
  async function registerProject(id: string, projectId: string): Promise<void> {
    await $api.patch(`/api/v1/retrospectives/register-project/${id}`, null, { params: { projectId } })
    invalidateDerivedCaches()
  }
  async function detachProject(id: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}/project`)
    invalidateDerivedCaches()
  }

  // 태그 연결 / 해제 (태그는 미리 생성된 tagId 필요)
  async function addTag(id: string, tagId: string): Promise<void> {
    await $api.post(`/api/v1/retrospectives/${id}/tags`, { tagId })
    invalidateDerivedCaches()
  }
  async function removeTag(id: string, tagId: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}/tags/${tagId}`)
    invalidateDerivedCaches()
  }

  // 첨부파일 업로드 URL 발급 — 파일 자체는 이 응답의 uploadUrl로 별도 PUT.
  // signal을 넘기면 업로드 중 삭제(×)했을 때 이 요청도 함께 취소할 수 있다.
  async function generateURL(id: string, file: UploadUrlRequest, signal?: AbortSignal): Promise<UploadURL> {
    const res = await $api.post<ApiResponse<UploadURL>>(`/api/v2/retrospectives/${id}/attachments`, file, { signal })
    return res.data.data
  }

  // 첨부파일 업로드 완료 확인 — S3에 PUT한 뒤 호출해 uploadStatus를 확정한다
  async function completeUpload(id: string, attachmentId: string, signal?: AbortSignal): Promise<AttachmentComplete> {
    const res = await $api.post<ApiResponse<AttachmentComplete>>(
      `/api/v2/retrospectives/${id}/attachments/${attachmentId}/complete`,
      undefined,
      { signal },
    )
    return res.data.data
  }

  // 전송된 메시지의 첨부파일 삭제 — 일반 첨부는 답변 편집 정책상 불가하고, 서버가 민감정보를
  // 감지해 삭제를 권고한 첨부만 삭제할 수 있다(그 외 요청은 서버가 거부).
  async function deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await $api.delete(`/api/v2/retrospectives/${id}/attachments/${attachmentId}`)
  }

  // 첨부파일 상세보기 URL 발급 — S3 GET presigned URL. 클릭해서 열어볼 때마다 새로 발급받아 쓴다
  // (만료 시각이 있어 캐싱해서 재사용하면 만료 후 깨질 수 있음)
  async function getAttachmentDownloadUrl(id: string, attachmentId: string): Promise<AttachmentDownloadUrl> {
    const res = await $api.get<ApiResponse<AttachmentDownloadUrl>>(
      `/api/v2/retrospectives/${id}/attachments/${attachmentId}/download-url`,
    )
    return res.data.data
  }

  // 회고 메모 — 회고 결과와 분리 저장되며, 회고를 삭제하면 함께 삭제된다
  async function getMemos(id: string): Promise<RetrospectiveMemo[]> {
    const res = await $api.get<ApiResponse<RetrospectiveMemo[]>>(`/api/v2/retrospectives/${id}/memos`)
    return res.data.data
  }
  async function createMemo(id: string, content: string): Promise<RetrospectiveMemo> {
    const res = await $api.post<ApiResponse<RetrospectiveMemo>>(`/api/v2/retrospectives/${id}/memos`, { content })
    return res.data.data
  }
  async function updateMemo(id: string, memoId: string, content: string): Promise<RetrospectiveMemo> {
    const res = await $api.patch<ApiResponse<RetrospectiveMemo>>(`/api/v2/retrospectives/${id}/memos/${memoId}`, { content })
    return res.data.data
  }
  async function deleteMemo(id: string, memoId: string): Promise<void> {
    await $api.delete(`/api/v2/retrospectives/${id}/memos/${memoId}`)
  }

  return {
    start,
    answer,
    getConversation,
    finish,
    getResult,
    answerByVoice,
    transcribe,
    getDeepQuestion,
    restart,
    exit,
    complete,
    getDetail,
    save,
    remove,
    updateTitle,
    registerProject,
    detachProject,
    addTag,
    removeTag,
    getAttachmentDownloadUrl,
    generateURL,
    completeUpload,
    deleteAttachment,
    getMemos,
    createMemo,
    updateMemo,
    deleteMemo,
  }
}

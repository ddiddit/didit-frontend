import type {
  ApiResponse,
  StartRetrospectiveResponse,
  SubmitAnswerResponse,
  TranscribeResponse,
  DeepQuestionResponse,
  CompleteRetrospectiveResponse,
  RetrospectiveDetail,
} from '~/types/api'
import { toUploadableAudio } from '~/utils/audio'

// 회고 진행 플로우 API 레이어.
// 대부분 mutation 성격이라 캐싱하지 않고, AI 생성(완료/심화질문/STT)은
// 기본 10초 타임아웃으로 부족할 수 있어 요청별로 더 길게 설정한다.
// 백엔드 RestClient 읽기 타임아웃(60초)보다 약간 길게 둬서, 서버가 먼저 끊고
// 정상 에러 응답(problem+json)을 주도록 한다(클라이언트가 먼저 abort하지 않게).
const AI_TIMEOUT = 65_000

export function useRetrospect() {
  const { $api } = useNuxtApp()

  // 회고 시작 → 첫 질문 반환
  async function start(): Promise<StartRetrospectiveResponse> {
    const res = await $api.post<ApiResponse<StartRetrospectiveResponse>>('/api/v1/retrospectives')
    return res.data.data
  }

  // 텍스트 답변 제출 → 다음 질문 또는 완료 준비 신호
  async function answer(id: string, content: string): Promise<SubmitAnswerResponse> {
    const res = await $api.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/v1/retrospectives/${id}/answers`,
      { content },
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

  // 심화질문 스킵
  async function skipDeepQuestion(id: string): Promise<void> {
    await $api.post(`/api/v1/retrospectives/${id}/skip`)
  }

  // 다시 시작 → 기존 회고 삭제 후 새 회고 시작 (첫 질문 반환). 하루 횟수 정책 적용됨.
  async function restart(id: string): Promise<StartRetrospectiveResponse> {
    const res = await $api.post<ApiResponse<StartRetrospectiveResponse>>(
      `/api/v1/retrospectives/${id}/restart`,
    )
    return res.data.data
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
    return res.data.data
  }

  // 회고 삭제 (soft delete)
  async function remove(id: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}`)
  }

  // 회고 제목 수정 (저장된 회고, 최대 25자)
  async function updateTitle(id: string, title: string): Promise<void> {
    await $api.patch(`/api/v1/retrospectives/${id}/title`, { title })
  }

  // 프로젝트 지정 / 해제
  async function registerProject(id: string, projectId: string): Promise<void> {
    await $api.patch(`/api/v1/retrospectives/register-project/${id}`, null, { params: { projectId } })
  }
  async function detachProject(id: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}/project`)
  }

  // 태그 연결 / 해제 (태그는 미리 생성된 tagId 필요)
  async function addTag(id: string, tagId: string): Promise<void> {
    await $api.post(`/api/v1/retrospectives/${id}/tags`, { tagId })
  }
  async function removeTag(id: string, tagId: string): Promise<void> {
    await $api.delete(`/api/v1/retrospectives/${id}/tags/${tagId}`)
  }

  return {
    start,
    answer,
    answerByVoice,
    transcribe,
    getDeepQuestion,
    skipDeepQuestion,
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
  }
}

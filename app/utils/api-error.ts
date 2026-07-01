import axios from 'axios'
import type { ApiErrorCode, ApiErrorResponse } from '~/types/api'

// 에러 코드별 사용자용 한국어 메시지
// 백엔드 detail은 개발자용 톤이라, 화면에 노출할 문구는 여기서 별도로 관리한다.
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  // 공통
  INVALID_REQUEST: '요청이 올바르지 않아요. 입력값을 확인해주세요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없어요.',
  INTERNAL_SERVER_ERROR: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
  // 인증/회원
  USER_NOT_FOUND: '사용자를 찾을 수 없어요.',
  USER_CONSENT_NOT_FOUND: '약관 동의 정보를 찾을 수 없어요.',
  WITHDRAWN_USER: '탈퇴한 계정이에요.',
  INVALID_REFRESH_TOKEN: '로그인이 만료되었어요. 다시 로그인해주세요.',
  EXPIRED_REFRESH_TOKEN: '로그인이 만료되었어요. 다시 로그인해주세요.',
  UNSUPPORTED_OAUTH_PROVIDER: '지원하지 않는 로그인 방식이에요.',
  DUPLICATE_NICKNAME: '이미 사용 중인 닉네임이에요.',
  OAUTH_USER_INFO_FAILED: '소셜 로그인 정보를 가져오지 못했어요. 다시 시도해주세요.',
  // 프로젝트/태그
  DUPLICATED_PROJECT_NAME: '이미 존재하는 프로젝트 이름이에요.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없어요.',
  PROJECT_LIMIT_EXCEEDED: '프로젝트는 최대 10개까지 만들 수 있어요.',
  DUPLICATED_TAG_NAME: '이미 존재하는 태그예요.',
  TAG_NOT_FOUND: '태그를 찾을 수 없어요.',
  INVALID_TAG_NAME: '태그명은 비어 있을 수 없고 10자 이하여야 해요.',
  RETRO_TAG_NOT_FOUND: '회고에서 해당 태그를 찾을 수 없어요.',
  // 알림
  NOTIFICATION_SETTING_NOT_FOUND: '알림 설정을 찾을 수 없어요.',
  NOTIFICATION_HISTORY_NOT_FOUND: '알림을 찾을 수 없어요.',
  // 문의
  INQUIRY_NOT_FOUND: '문의를 찾을 수 없어요.',
  // 공지
  NOTICE_NOT_FOUND: '공지사항을 찾을 수 없어요.',
  NOTICE_FORBIDDEN: '공지사항에 접근할 수 없어요.',
  // 회고
  RETROSPECTIVE_NOT_FOUND: '회고를 찾을 수 없어요.',
  RETROSPECTIVE_ALREADY_COMPLETED: '이미 완료된 회고예요.',
  RETROSPECTIVE_NOT_IN_PROGRESS: '진행 중인 회고가 아니에요.',
  DAILY_LIMIT_EXCEEDED: '오늘 회고 횟수를 모두 사용했어요.',
  SUMMARY_NOT_GENERATED: 'AI 요약이 아직 생성되지 않았어요. 잠시 후 다시 시도해주세요.',
  SPEECH_EMPTY_FILE: '음성 파일이 비어 있어요.',
  SPEECH_UNSUPPORTED_FILE: '지원하지 않는 음성 파일 형식이에요.',
  SPEECH_EMPTY_RESULT: '음성 인식 결과가 비어 있어요. 다시 말씀해주세요.',
  SPEECH_TRANSCRIPTION_FAILED: '음성 인식에 실패했어요. 다시 시도해주세요.',
}

const DEFAULT_MESSAGE = '문제가 발생했어요. 잠시 후 다시 시도해주세요.'

// 어떤 에러든 백엔드 에러 코드를 안전하게 꺼낸다 (없으면 null)
export function getApiErrorCode(error: unknown): ApiErrorCode | null {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.properties?.code ?? null
  }
  return null
}

// 특정 코드인지 판별 (catch 블록에서 분기용)
export function isApiError(error: unknown, code: ApiErrorCode): boolean {
  return getApiErrorCode(error) === code
}

// 네트워크 단절 여부 (서버 응답 자체가 없는 경우) → 전체 화면 에러의 network/server 분기용
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

// 서버 오류(5xx) 여부 → '일시적인 오류' / '알 수 없는 오류' 분기용
export function isServerError(error: unknown): boolean {
  return axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500
}

// 인증 만료/무효 여부 → 에러 화면이 아니라 로그인으로 보내야 하는 케이스
// (401, 또는 리프레시 토큰 만료·무효·탈퇴 코드). axios 인터셉터가 redirectToLogin 처리.
export function isAuthError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (error.response?.status === 401) return true
  const code = getApiErrorCode(error)
  return code === 'EXPIRED_REFRESH_TOKEN' || code === 'INVALID_REFRESH_TOKEN' || code === 'WITHDRAWN_USER'
}

// 로드 실패를 전체 화면 에러 variant로 매핑 (에러코드 우선)
// network=응답없음(끊김) / server=INTERNAL_SERVER_ERROR(5xx) / generic=그 외(알 수 없음)
export function toErrorVariant(error: unknown): 'network' | 'server' | 'generic' {
  // 1) 응답 자체가 없으면 네트워크 끊김 (코드가 존재할 수 없음)
  if (isNetworkError(error)) return 'network'
  // 2) 서버 내부 오류 코드 → '일시적인 오류' (코드 없는 5xx 게이트웨이 오류도 포함)
  if (getApiErrorCode(error) === 'INTERNAL_SERVER_ERROR' || isServerError(error)) return 'server'
  // 3) 그 외 → '알 수 없는 오류'
  return 'generic'
}

// 토스트/인라인 문구로 바로 쓸 한국어 메시지
// fallback: 코드를 못 찾았을 때(네트워크 오류 등) 보여줄 문구
export function getApiErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  const code = getApiErrorCode(error)
  return code ? ERROR_MESSAGES[code] : fallback
}

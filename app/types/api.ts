export interface ApiResponse<T> {
  data: T
}

// 앱 설정
export interface AppConfig {
  maintenanceMode: boolean
  maintenanceMessage: string | null
  minimumVersion: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

// Auth
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  isNewUser: boolean
  isOnboardingCompleted: boolean
}

export type JobType = 'DEVELOPER' | 'PLANNER' | 'DESIGNER'
export type AgeType = 'AGE_20' | 'AGE_30' | 'AGE_40_PLUS'
export type ExperienceType = 'LESS_THAN_1_YEAR' | 'YEARS_1_TO_2' | 'YEARS_3_TO_5' | 'YEARS_6_TO_9' | 'YEARS_10_PLUS'

export interface UserProfile {
  nickname: string | null
  job: JobType | null
  email: string | null
  age: AgeType | null
  experience: ExperienceType | null
  provider: 'KAKAO' | 'GOOGLE' | 'APPLE'
  level?: number
}

export interface NicknameCheckResponse {
  isDuplicate: boolean
}

export interface OnboardingRequest {
  nickname: string
  job: JobType
  age: AgeType
  experience: ExperienceType
  marketingAgreed: boolean
  nightPushAgreed: boolean
}

// Home
export interface HomeResponse {
  nickname: string
  todayRetrospectiveCount: number
  recentRetrospectives: RecentRetrospective[]
}

export interface RecentRetrospective {
  id: string
  title: string | null
  summary: string | null
  completedAt: string | null
  projectName: string | null
  tags: Tag[]
}

// Retrospective
export type RetrospectiveStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface Retrospective {
  id: string
  title: string
  summary: string | null
  status: RetrospectiveStatus
  projectId: string | null
  projectName: string | null
  tags: Tag[]
  createdAt: string
  completedAt: string | null
}

// 회고 질문 타입 (기본 질문 Q1~Q4, 이후 AI 심화질문)
export type QuestionType = string

// 회고 시작 → 첫 질문 반환
export interface StartRetrospectiveResponse {
  retrospectiveId: string
  firstQuestionType: QuestionType
  firstQuestionContent: string
}

// 답변 제출(텍스트/음성 공통) → 다음 질문 또는 완료 준비 신호
export interface SubmitAnswerResponse {
  content: string | null // 음성 답변일 때 STT 변환 텍스트, 텍스트 답변이면 null
  nextQuestionType: QuestionType | null
  nextQuestionContent: string | null
  isReadyToComplete: boolean
}

// 음성 → 텍스트 변환 전용 (전송 전 미리보기용)
export interface TranscribeResponse {
  content: string
}

// AI 심화질문 조회 (생성 대기 중이면 isReady=false 로 폴링)
export interface DeepQuestionResponse {
  isReady: boolean
  content: string | null
}

// 제목 + 설명 쌍 (insight, nextAction)
export interface RetrospectiveInsight {
  title: string
  description: string
}

// AI가 생성한 회고 요약 본문
export interface RetrospectiveContent {
  summary: string
  blockedPoint: string[]
  solutionProcess: string[]
  lessonLearned: string[]
  insight: RetrospectiveInsight
  nextAction: RetrospectiveInsight
}

// 회고 완료 → AI 제목/요약 생성
export interface CompleteRetrospectiveResponse {
  title: string
  content: RetrospectiveContent
}

// 회고 상세 (완료된 회고, v2: 프로젝트/태그 포함)
export interface RetrospectiveDetail {
  id: string
  title: string
  status: RetrospectiveStatus
  content: RetrospectiveContent
  completedAt: string | null
  project: { id: string; name: string } | null
  tags: Tag[]
}

// Calendar
export interface CalendarDay {
  date: string
  count: number
}

export interface CalendarResponse {
  year: number
  month: number
  days: CalendarDay[]
  weeklyCount: number
  isWeeklyGoalAchieved: boolean
}

export interface DailyRetrospective {
  id: string
  title: string
  summary: string | null
  projectName: string | null
  tags: Tag[]
  completedAt: string
}

// Project
export interface Project {
  id: string
  name: string
  order: number
  retrospectiveCount: number
}

// Tag
export interface Tag {
  id: string
  name: string
  retrospectiveCount?: number
}

// Badge
export type BadgeConditionType = 'FIRST_RETRO' | 'STREAK_3_DAYS' | 'TOTAL_30'

export interface Badge {
  id: string
  name: string
  description: string
  conditionType: BadgeConditionType
  acquired: boolean
  acquiredAt: string | null
  imageUrl: string
}

// Notification
export type NotificationType = 'DAILY_REMINDER' | 'INQUIRY_ANSWERED' | 'RETROSPECTIVE_RESULT_CREATED'

export interface NotificationHistory {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null // 클릭 시 이동할 경로 (예: 회고 상세). 없으면 null
  isRead: boolean
  createdAt: string
}

export interface NotificationSetting {
  enabled: boolean
  reminderTime: string | null
  nightPushConsent: boolean
  marketingAgreed: boolean
}

// Notice (공지사항)
export interface NoticeListItem {
  id: string
  title: string
}

export interface NoticeDetail {
  id: string
  title: string
  content: string
  createdAt: string
}

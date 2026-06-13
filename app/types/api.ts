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
  title: string
  summary: string
  completedAt: string
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

export interface RetrospectiveDetail extends Retrospective {
  qnas: Qna[]
}

export interface Qna {
  id: string
  question: string
  answer: string
  deepQuestions: DeepQna[]
}

export interface DeepQna {
  id: string
  question: string
  answer: string | null
}

export interface StartRetrospectiveResponse {
  id: string
  currentQuestion: string
  questionIndex: number
  totalQuestions: number
}

export interface SubmitAnswerResponse {
  isCompleted: boolean
  nextQuestion: string | null
  questionIndex: number | null
  deepQuestion: string | null
  retrospectiveId: string
}

export interface CompleteRetrospectiveResponse {
  id: string
  title: string
  summary: string
  completedAt: string
}

// Calendar
export interface CalendarDay {
  date: string
  count: number
}

export interface DailyRetrospective {
  id: string
  title: string
  summary: string | null
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
export type NotificationType = 'DAILY_REMINDER' | 'INQUIRY_ANSWERED'

export interface NotificationHistory {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export interface NotificationSetting {
  enabled: boolean
  reminderTime: string | null
  nightPushConsent: boolean
  marketingAgreed: boolean
}

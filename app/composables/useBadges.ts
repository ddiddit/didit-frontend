import type { ApiResponse } from '~/types/api'

// 백엔드 BadgeConditionType (대응되는 배지만 매핑)
export type BadgeConditionType =
  | 'FIRST_RETRO'
  | 'STREAK_3_DAYS'
  | 'TOTAL_30'
  | 'DEEP_QUESTION_1'
  | 'DEEP_QUESTION_5'
  | 'DEEP_QUESTION_10'
  | 'WEEKLY_3_FIRST'
  | 'WEEKLY_3_THREE_WEEKS'

// 배지 카탈로그 정의 (그리드 표시 순서)
export interface BadgeDef {
  code: string                        // 식별자(이미지 파일명)
  name: string                         // 배지 이름 (예: '10회 기록')
  description: string                  // 그리드 하단 설명 (예: '회고 10개 저장하기')
  unlockText: string                   // 바텀시트 안내 문구 (미획득 시)
  congratsText: string                 // 획득 팝업 축하 문구
  conditionType?: BadgeConditionType    // 백엔드 대응 조건 (없으면 백엔드 미구현 → 항상 잠금)
  countable?: boolean                   // 회고 개수 표기 여부 (10회/30회만)
  goal?: number                         // 목표 개수 (countable일 때)
}

// 활동 배지 10종 (피그마 '목표 달성 배지' 기준)
// conditionType이 없는 배지는 백엔드에 아직 없어 항상 잠금 상태로 표시됨
export const BADGE_CATALOG: BadgeDef[] = [
  { code: 'first-record',      name: '첫 기록',         description: '회고 1개 저장하기',           unlockText: '회고를 1개 저장하면 받을 수 있어요.',         congratsText: '드디어 첫 회고를 기록했네요.\n오늘의 시작이 멋진 습관이 될 거예요.', conditionType: 'FIRST_RETRO' },
  { code: 'record-10',         name: '10회 기록',        description: '회고 10개 저장하기',          unlockText: '회고를 10개 저장하면 받을 수 있어요.',        congratsText: '10번의 회고가 쌓였네요!\n꾸준한 기록이 성장을 만들어요.', countable: true, goal: 10 },
  { code: 'record-30',         name: '30회 기록',        description: '회고 30개 저장하기',          unlockText: '회고를 30개 저장하면 받을 수 있어요.',        congratsText: '30회 기록 달성! 정말 대단해요.\n회고가 이제 일상이 됐군요.', countable: true, goal: 30, conditionType: 'TOTAL_30' },
  { code: 'project-collector', name: '프로젝트 컬렉터',   description: '프로젝트 3개 만들기',          unlockText: '프로젝트를 3개 만들면 받을 수 있어요.',        congratsText: '프로젝트 3개를 만들었어요!\n체계적인 회고의 시작이에요.' },
  { code: 'project-picker',    name: '프로젝트 피커',     description: '회고 5개를 프로젝트에 담기',    unlockText: '회고 5개를 프로젝트에 담으면 받을 수 있어요.', congratsText: '회고 5개를 프로젝트에 담았어요!\n정리가 성장을 앞당겨요.' },
  { code: 'project-digger',    name: '프로젝트 디기너',   description: '한 프로젝트에 회고 3개 담기',   unlockText: '한 프로젝트에 회고 3개를 담으면 받을 수 있어요.', congratsText: '한 프로젝트에 3개의 회고를 담았어요!\n깊이 있는 탐구가 시작됐어요.' },
  { code: 'routine-first',     name: '루틴의 첫 걸음',    description: '한 주에 회고 3개 쓰기',        unlockText: '한 주에 회고 3개를 쓰면 받을 수 있어요.',     congratsText: '이번 주 회고 3개를 달성했어요!\n루틴이 시작됐네요.', conditionType: 'WEEKLY_3_FIRST' },
  { code: 'routine-power',     name: '루틴의 힘',         description: '3주 동안 매주 회고 3개 쓰기',  unlockText: '3주 동안 매주 회고 3개를 쓰면 받을 수 있어요.', congratsText: '3주 연속 달성이에요!\n꾸준함이 진짜 힘이 되고 있어요.', conditionType: 'WEEKLY_3_THREE_WEEKS' },
  { code: 'routine-streak',    name: '루틴의 지속',       description: '4주 연속 회고 남기기',         unlockText: '4주 연속 회고를 남기면 받을 수 있어요.',      congratsText: '4주 연속 회고 달성!\n이 습관, 정말 대단해요.' },
  { code: 'didit-lover',       name: '디딧 러버',         description: '1주 동안 매일 접속하기',       unlockText: '1주 동안 매일 접속하면 받을 수 있어요.',      congratsText: '일주일 동안 매일 접속했어요!\n디딧과 함께하는 하루가 즐거워요.' },
]

// 화면 렌더링용 배지 (정의 + 획득 상태)
export interface BadgeView extends BadgeDef {
  image: string          // 배지 이미지 경로
  acquired: boolean      // 획득 여부
  acquiredAt: string | null
  current: number        // 진행 개수 (countable일 때)
}

// 백엔드 응답 (GET /api/v1/badges)
interface BadgeApiItem {
  id: string
  name: string
  description: string
  conditionType: string
  acquired: boolean
  acquiredAt: string | null
}

export function useBadges() {
  const { $api } = useNuxtApp()

  function buildDefault(): BadgeView[] {
    return BADGE_CATALOG.map(def => ({
      ...def,
      image: `/badges/${def.code}.svg`,
      acquired: false,
      acquiredAt: null,
      current: 0,
    }))
  }

  const badges = ref<BadgeView[]>(buildDefault())
  const loaded = ref(false)

  async function load() {
    try {
      const res = await $api.get<ApiResponse<BadgeApiItem[]>>('/api/v1/badges')
      // 백엔드는 conditionType으로 식별
      const byCondition = new Map<string, BadgeApiItem>()
      for (const item of res.data.data ?? []) {
        if (item.conditionType) byCondition.set(item.conditionType, item)
      }
      badges.value = BADGE_CATALOG.map((def) => {
        const api = def.conditionType ? byCondition.get(def.conditionType) : undefined
        return {
          ...def,
          image: `/badges/${def.code}.svg`,
          acquired: api?.acquired ?? false,
          acquiredAt: api?.acquiredAt ?? null,
          current: 0,
        }
      })
    } catch {
      badges.value = buildDefault()
    } finally {
      loaded.value = true
    }
  }

  // BadgeApiItem → BadgeView (카탈로그 정의와 매칭, 미정의 conditionType은 제외)
  function mapToView(item: BadgeApiItem): BadgeView | null {
    const def = BADGE_CATALOG.find((d) => d.conditionType && d.conditionType === item.conditionType)
    if (!def) return null
    return {
      ...def,
      image: `/badges/${def.code}.svg`,
      acquired: true,
      acquiredAt: item.acquiredAt,
      current: 0,
    }
  }

  // 아직 안 보여준 신규 획득 배지 조회 (GET /badges/popup). 배지 적립은 비동기라 1회 재시도.
  async function fetchUnnotified(): Promise<BadgeView[]> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await $api.get<ApiResponse<BadgeApiItem[]>>('/api/v1/badges/popup')
        const views = (res.data.data ?? []).map(mapToView).filter((b): b is BadgeView => b !== null)
        if (views.length) return views
      } catch {
        return []
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000))
    }
    return []
  }

  // 최근 획득 배지 (acquiredAt 최신순 첫 번째)
  const recentBadge = computed<BadgeView | null>(() => {
    const acquired = badges.value.filter(b => b.acquired)
    if (acquired.length === 0) return null
    const sorted = [...acquired].sort((a, b) => {
      const ta = a.acquiredAt ? new Date(a.acquiredAt).getTime() : 0
      const tb = b.acquiredAt ? new Date(b.acquiredAt).getTime() : 0
      return tb - ta
    })
    return sorted[0] ?? null
  })

  return { badges, recentBadge, loaded, load, fetchUnnotified }
}

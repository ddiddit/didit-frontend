import type { ApiResponse } from '~/types/api'
import { parseServerDate } from '~/utils/date'

// 백엔드 BadgeConditionType (GET /api/v1/badges 의 conditionType)
export type BadgeConditionType =
  | 'CUMULATIVE_RETRO'       // 누적 회고 (threshold회)
  | 'PROJECT_COUNT'          // 프로젝트 생성 수
  | 'PROJECT_TAGGED_RETRO'   // 프로젝트 지정 회고 수
  | 'PROJECT_RETRO_IN_ONE'   // 한 프로젝트 내 회고 수
  | 'WEEKLY_RETRO_COUNT'     // 한 주 회고 수
  | 'WEEKLY_STREAK'          // 연속 주
  | 'DAILY_ACCESS_STREAK'    // 연속 접속일

// 배지 카탈로그 정의 (그리드 표시 순서) — 백엔드 배지와 (conditionType + threshold)로 매칭
export interface BadgeDef {
  code: string                        // 식별자(이미지 파일명)
  name: string                         // 배지 이름 (예: '10회 기록')
  description: string                  // 그리드 하단 설명 (예: '회고 10개 저장하기')
  unlockText: string                   // 바텀시트 안내 문구 (미획득 시)
  congratsText: string                 // 획득 팝업 축하 문구
  conditionType: BadgeConditionType    // 백엔드 대응 조건
  threshold: number                    // 백엔드 대응 임계값
  countable?: boolean                   // 회고 개수 표기 여부 (10회/30회만)
  goal?: number                         // 목표 개수 (countable일 때)
}

// 활동 배지 10종 (백엔드 /api/v1/badges 와 동일 구성)
export const BADGE_CATALOG: BadgeDef[] = [
  { code: 'first-record',      name: '첫 기록',         description: '회고 1개 저장하기',           unlockText: '회고를 1개 저장하면 받을 수 있어요.',         congratsText: '드디어 첫 회고를 기록했네요.\n오늘의 시작이 멋진 습관이 될 거예요.', conditionType: 'CUMULATIVE_RETRO', threshold: 1 },
  { code: 'record-10',         name: '10회 기록',        description: '회고 10개 저장하기',          unlockText: '회고를 10개 저장하면 받을 수 있어요.',        congratsText: '10번의 회고가 쌓였네요!\n꾸준한 기록이 성장을 만들어요.', conditionType: 'CUMULATIVE_RETRO', threshold: 10, countable: true, goal: 10 },
  { code: 'record-30',         name: '30회 기록',        description: '회고 30개 저장하기',          unlockText: '회고를 30개 저장하면 받을 수 있어요.',        congratsText: '30회 기록 달성! 정말 대단해요.\n회고가 이제 일상이 됐군요.', conditionType: 'CUMULATIVE_RETRO', threshold: 30, countable: true, goal: 30 },
  { code: 'project-collector', name: '프로젝트 컬렉터',   description: '프로젝트 3개 만들기',          unlockText: '프로젝트를 3개 만들면 받을 수 있어요.',        congratsText: '프로젝트 3개를 만들었어요!\n체계적인 회고의 시작이에요.', conditionType: 'PROJECT_COUNT', threshold: 3 },
  { code: 'project-picker',    name: '프로젝트 피커',     description: '회고 5개를 프로젝트에 담기',    unlockText: '회고 5개를 프로젝트에 담으면 받을 수 있어요.', congratsText: '회고 5개를 프로젝트에 담았어요!\n정리가 성장을 앞당겨요.', conditionType: 'PROJECT_TAGGED_RETRO', threshold: 5 },
  { code: 'project-digger',    name: '프로젝트 디기너',   description: '한 프로젝트에 회고 3개 담기',   unlockText: '한 프로젝트에 회고 3개를 담으면 받을 수 있어요.', congratsText: '한 프로젝트에 3개의 회고를 담았어요!\n깊이 있는 탐구가 시작됐어요.', conditionType: 'PROJECT_RETRO_IN_ONE', threshold: 3 },
  { code: 'routine-first',     name: '루틴의 첫 걸음',    description: '한 주에 회고 3개 쓰기',        unlockText: '한 주에 회고 3개를 쓰면 받을 수 있어요.',     congratsText: '이번 주 회고 3개를 달성했어요!\n루틴이 시작됐네요.', conditionType: 'WEEKLY_RETRO_COUNT', threshold: 3 },
  { code: 'routine-power',     name: '루틴의 힘',         description: '3주 동안 매주 회고 3개 쓰기',  unlockText: '3주 동안 매주 회고 3개를 쓰면 받을 수 있어요.', congratsText: '3주 연속 달성이에요!\n꾸준함이 진짜 힘이 되고 있어요.', conditionType: 'WEEKLY_STREAK', threshold: 3 },
  { code: 'routine-streak',    name: '루틴의 지속',       description: '4주 연속 회고 남기기',         unlockText: '4주 연속 회고를 남기면 받을 수 있어요.',      congratsText: '4주 연속 회고 달성!\n이 습관, 정말 대단해요.', conditionType: 'WEEKLY_STREAK', threshold: 4 },
  { code: 'didit-lover',       name: '디딧 러버',         description: '1주 동안 매일 접속하기',       unlockText: '1주 동안 매일 접속하면 받을 수 있어요.',      congratsText: '일주일 동안 매일 접속했어요!\n디딧과 함께하는 하루가 즐거워요.', conditionType: 'DAILY_ACCESS_STREAK', threshold: 7 },
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
  category: string
  conditionType: string
  threshold: number
  iconUrl: string | null
  congratsTitle: string
  congratsMessage: string
  acquired: boolean
  acquiredAt: string | null
}

// 백엔드 배지 식별 키 (conditionType + threshold)
function keyOf(conditionType: string, threshold: number): string {
  return `${conditionType}:${threshold}`
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

  // countable 배지(10회/30회) 진행 표기용 — 백엔드 배지 응답엔 카운트가 없어 완료 회고 수를 직접 센다.
  async function fetchRetroCount(): Promise<number> {
    try {
      const res = await $api.get<ApiResponse<{ completedAt: string | null }[]>>('/api/v2/retrospectives')
      return (res.data.data ?? []).filter((r) => r.completedAt).length
    } catch {
      return 0
    }
  }

  // throwOnError=true면 에러를 던진다(useLoadState.run과 함께 에러 화면 분기용)
  async function load(throwOnError = false) {
    try {
      const [badgeRes, retroCount] = await Promise.all([
        $api.get<ApiResponse<BadgeApiItem[]>>('/api/v1/badges'),
        fetchRetroCount(),
      ])
      // 백엔드는 conditionType + threshold 로 식별
      const byKey = new Map<string, BadgeApiItem>()
      for (const item of badgeRes.data.data ?? []) {
        byKey.set(keyOf(item.conditionType, item.threshold), item)
      }
      badges.value = BADGE_CATALOG.map((def) => {
        const api = byKey.get(keyOf(def.conditionType, def.threshold))
        return {
          ...def,
          image: `/badges/${def.code}.svg`,
          acquired: api?.acquired ?? false,
          acquiredAt: api?.acquiredAt ?? null,
          // 회고 수 기준 배지만 진행 카운트 표기 (목표 초과 시 목표값으로 캡)
          current: def.countable ? Math.min(retroCount, def.goal ?? retroCount) : 0,
        }
      })
    } catch (e) {
      badges.value = buildDefault()
      if (throwOnError) throw e
    } finally {
      loaded.value = true
    }
  }

  // BadgeApiItem → BadgeView (카탈로그 정의와 매칭, 미정의는 제외)
  function mapToView(item: BadgeApiItem): BadgeView | null {
    const def = BADGE_CATALOG.find((d) => keyOf(d.conditionType, d.threshold) === keyOf(item.conditionType, item.threshold))
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
      const ta = a.acquiredAt ? parseServerDate(a.acquiredAt).getTime() : 0
      const tb = b.acquiredAt ? parseServerDate(b.acquiredAt).getTime() : 0
      return tb - ta
    })
    return sorted[0] ?? null
  })

  return { badges, recentBadge, loaded, load, fetchUnnotified }
}

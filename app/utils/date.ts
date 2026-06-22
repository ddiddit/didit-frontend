// 서버 시각 파싱 유틸
//
// 백엔드는 타임존 표기가 없는 UTC LocalDateTime 문자열(예: '2026-06-22T12:53:31.0269')을 내려준다.
// new Date()는 타임존이 없으면 이를 브라우저 로컬(KST)로 해석해 9시간만큼 밀린다.
// 따라서 시간 정보(T)가 있고 타임존 표기가 없으면 UTC(Z)로 보정해 파싱한다.
// 날짜만 있는 문자열('2026-06-01')은 그대로 두어 날짜 경계가 어긋나지 않게 한다.
export function parseServerDate(value: string): Date {
  const hasTimezone = /[zZ]$/.test(value) || /[+-]\d{2}:?\d{2}$/.test(value)
  const normalized = !hasTimezone && value.includes('T') ? `${value}Z` : value
  return new Date(normalized)
}

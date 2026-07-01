// 레벨별 색상 — Figma 직접 추출 (accent=Tag 컬러/뱃지, fill=완료 스탬프[횟수형]·진행바 채움[연속주형])
// 미션 카드·마이페이지 등 공용. Lv.10 fill만 28343 확정 필요.
export const LEVEL_THEME: Record<number, { accent: string; fill: string }> = {
  1: { accent: '#5A8DEE', fill: '#C5D7F9' },
  2: { accent: '#8C7CF0', fill: '#B4ABF0' },
  3: { accent: '#E079E0', fill: '#EEB5EE' },
  4: { accent: '#DEAD3A', fill: '#EBCE89' },
  5: { accent: '#F08A5D', fill: '#F7BFA6' },
  6: { accent: '#F06C6C', fill: '#F6A7A7' },
  7: { accent: '#C78B5C', fill: '#E0BFA5' },
  8: { accent: '#77C767', fill: '#ADDDA4' },
  9: { accent: '#65ABE0', fill: '#AAD1EE' },
  10: { accent: '#37C58A', fill: '#A9E6CB' },
}

export function levelTheme(level: number): { accent: string; fill: string; light: string } {
  const t = LEVEL_THEME[level] ?? LEVEL_THEME[1]!
  const n = parseInt(t.accent.slice(1), 16)
  // 뱃지 배경 = accent 15% (Figma)
  const light = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.15)`
  return { accent: t.accent, fill: t.fill, light }
}

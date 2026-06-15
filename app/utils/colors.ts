/**
 * 피그마 디자인 토큰 — 단일 소스
 * tailwind.config.ts와 Vue 컴포넌트에서 공통으로 사용
 */

// Primary 팔레트 (피그마 Primary Color)
export const primary = {
  10: '#ECFBF5',
  20: '#E2FAF0',
  30: '#C3F4DF',
  50: '#3DDB99',
  55: '#37C58A',
  60: '#31AF7A',
  70: '#2EA473',
  80: '#25835C',
  90: '#1B6345',
  95: '#154D36',
} as const

// Neutral 팔레트 (피그마 Neutral Color)
export const neutral = {
  0:   '#FFFFFF',
  5:   '#FDFDFD',
  10:  '#F6F6F6',
  20:  '#F1F1F1',
  30:  '#E6E6E6',
  40:  '#C6C6C6',
  50:  '#989898',
  60:  '#6A6A6A',
  70:  '#575757',
  80:  '#3C3C3C',
  90:  '#353535',
  95:  '#2B2B2B',
  100: '#191919',
} as const

// Tag 팔레트 (피그마 Tag Color)
export const tag = {
  red:              '#F06C6C',
  orange:           '#F08A5D',
  yellow:           '#DEAD3A',
  'leaf-green':     '#77C767',
  green:            '#37C58A',
  'sky-blue':       '#65ABE0',
  blue:             '#5A8DEE',
  purple:           '#8C7CF0',
  pink:             '#E079E0',
  brown:            '#C78B5C',
  'red-light':      '#FDECEC',
  'orange-light':   '#FDEDE7',
  'yellow-light':   '#FAF3E1',
  'leaf-green-light': '#EBF7E8',
  'green-light':    '#E2FAF0',
  'sky-blue-light': '#E8F2FA',
  'blue-light':     '#E6EEFC',
  'purple-light':   '#EEEBFD',
  'pink-light':     '#FAEBFA',
  'brown-light':    '#F7EEE7',
} as const

// System 팔레트 (피그마 System Color)
export const system = {
  danger50: '#FF5C5C',
  danger60: '#F73838',
  accent50:  '#FF6E58',
} as const

// 피그마 토큰명 → 색상값 직접 참조용 (예: colors.primary[50], colors.neutral[60])
export const colors = { primary, neutral, tag, system } as const

export type PrimaryShade = keyof typeof primary
export type NeutralShade = keyof typeof neutral
export type TagColor = keyof typeof tag

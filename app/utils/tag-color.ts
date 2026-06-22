// 태그 색상은 백엔드가 주지 않으므로, 태그 식별값(id/name) 기반으로 컬러 시스템에서 자동 부여한다.
// (명세: 태그 컬러칩은 컬러 시스템에 따라 자동부여)
export type TagColorName =
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'yellow'
  | 'pink'
  | 'red'
  | 'leaf-green'
  | 'sky-blue'
  | 'brown'

const TAG_COLOR_ORDER: TagColorName[] = [
  'green',
  'blue',
  'orange',
  'purple',
  'yellow',
  'pink',
  'red',
  'leaf-green',
  'sky-blue',
  'brown',
]

export function getTagColor(key: string): TagColorName {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return TAG_COLOR_ORDER[hash % TAG_COLOR_ORDER.length]!
}

// 태그 칩 배경/글자 색 클래스 (UiTag.vue에 동일 클래스가 리터럴로 존재해 Tailwind가 생성함)
export function getTagColorClasses(key: string): { bg: string; text: string } {
  const c = getTagColor(key)
  return { bg: `bg-tag-${c}-light`, text: `text-tag-${c}` }
}

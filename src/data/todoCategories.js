// 투두 프리셋 분류 — Todo 페이지와 홈 카드가 공유한다.
export const TODO_CATEGORIES = [
  { key: 'work', name: '업무', icon: '💼', color: '#4C6FFF', bg: '#E8F0FF' },
  { key: 'personal', name: '개인', icon: '🙂', color: '#2FA36B', bg: '#E4F7F0' },
  { key: 'urgent', name: '긴급', icon: '🔥', color: '#E05B5B', bg: '#FFECEC' },
  { key: 'meeting', name: '회의', icon: '📅', color: '#C99A2E', bg: '#FFF6DE' },
  { key: 'etc', name: '기타', icon: '📌', color: '#7C5CFC', bg: '#EFE9FF' },
]

export const DEFAULT_CATEGORY = 'work'

// 분류 키로 메타를 찾되, 없거나(레거시 항목) 알 수 없는 키면 '기타'로 폴백
export function categoryOf(key) {
  return TODO_CATEGORIES.find((c) => c.key === key) || TODO_CATEGORIES[TODO_CATEGORIES.length - 1]
}

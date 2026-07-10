import { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react'

/**
 * 목록을 "화면 높이에 맞춰" 페이지로 자른다(스크롤이 안 생기도록).
 * 리스트 컨테이너의 화면상 위치에서 뷰포트 하단까지의 여유 높이를 재고,
 * (행 높이 + 간격)으로 나눠 페이지당 개수를 자동 계산한다.
 *
 * @param items     전체 항목 배열
 * @param rowHeight 한 행의 대략 높이(px)
 * @param opts.gap  행 간격(px)
 * @param opts.reserved 리스트 아래(페이저·버튼·여백)로 비워둘 높이(px)
 * @param opts.min  최소 페이지당 개수
 * 반환: { ref, pageItems, page, setPage, totalPages, perPage }
 */
export default function useAutoPage(items, rowHeight, { gap = 9, reserved = 80, min = 1 } = {}) {
  const ref = useRef(null)
  const [perPage, setPerPage] = useState(min)
  const [page, setPage] = useState(0)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    // 실제 첫 행 높이를 재서 정확도를 높이고(없으면 추정치), 4px 안전 여유를 둔다
    const first = el.firstElementChild
    const measured = first ? Math.round(first.getBoundingClientRect().height) : 0
    const rh = measured > 0 ? measured : rowHeight
    const avail = window.innerHeight - top - reserved - 4
    const n = Math.max(min, Math.floor((avail + gap) / (rh + gap)))
    setPerPage((p) => (p === n ? p : n))
  }, [rowHeight, gap, reserved, min])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // 위쪽 콘텐츠(헤더·입력·탭 등) 높이가 바뀌어 리스트 시작 위치가 달라질 때 재계산
  useEffect(() => {
    measure()
  }, [items.length, measure])

  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const cur = Math.min(page, totalPages - 1)
  const pageItems = items.slice(cur * perPage, cur * perPage + perPage)
  return { ref, pageItems, page: cur, setPage, totalPages, perPage }
}

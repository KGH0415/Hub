import { useState, useEffect } from 'react'

// Hacker News 프런트페이지 헤드라인 (6초마다 순환)
const URL = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15'

export default function useNews() {
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let alive = true
    fetch(URL)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.hits || [])
          .filter((h) => h.title)
          .map((h) => ({
            title: h.title,
            url: h.url || 'https://news.ycombinator.com/item?id=' + h.objectID,
          }))
        if (alive && list.length) {
          setItems(list)
          setIdx(0)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 6000)
    return () => clearInterval(id)
  }, [items])

  return { items, idx, current: items[idx] || null }
}

import { useState } from 'react'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function MiniCalendar() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const today = new Date()
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d) =>
    d === today.getDate() &&
    cursor.month === today.getMonth() &&
    cursor.year === today.getFullYear()

  const move = (delta) => {
    setCursor((c) => {
      const m = c.month + delta
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      }
    })
  }

  return (
    <div className="mini-calendar">
      <div className="cal-head">
        <button type="button" onClick={() => move(-1)} aria-label="이전 달">
          ‹
        </button>
        <span>
          {cursor.year}년 {cursor.month + 1}월
        </span>
        <button type="button" onClick={() => move(1)} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={'cal-cell' + (d && isToday(d) ? ' today' : '')}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  )
}

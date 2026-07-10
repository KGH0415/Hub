import { useState, useRef, useEffect } from 'react'

// 앱 디자인 언어에 맞춘 커스텀 날짜 선택기 (네이티브 <input type="date"> 대체).
// value/onChange 는 'YYYY-MM-DD' 문자열(빈 문자열이면 미설정)로 원본 공지 로직과 호환된다.

const WEEKDAYS = [
  { n: '일', c: '#E05B5B' }, { n: '월', c: '#98A0B3' }, { n: '화', c: '#98A0B3' },
  { n: '수', c: '#98A0B3' }, { n: '목', c: '#98A0B3' }, { n: '금', c: '#98A0B3' }, { n: '토', c: '#4C6FFF' },
]
const pad = (n) => String(n).padStart(2, '0')
const fmt = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d)
function parse(v) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v || '')
  if (!m) return null
  return { y: +m[1], m: +m[2] - 1, d: +m[3] }
}

export default function DatePicker({ value, onChange, placeholder = '날짜 선택', accent = '#7C5CFC', size = 'md', min, max }) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(null) // { y, m }
  const [hover, setHover] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const sel = parse(value)
  const now = new Date()
  const base = cursor || (sel ? { y: sel.y, m: sel.m } : { y: now.getFullYear(), m: now.getMonth() })

  const first = new Date(base.y, base.m, 1).getDay()
  const daysInMonth = new Date(base.y, base.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d) => d === now.getDate() && base.m === now.getMonth() && base.y === now.getFullYear()
  const isSel = (d) => sel && d === sel.d && base.m === sel.m && base.y === sel.y

  const move = (delta) => {
    let m = base.m + delta, y = base.y
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCursor({ y, m })
  }
  const openPicker = () => { setCursor(base); setOpen((o) => !o) }
  const pick = (d) => { onChange(fmt(base.y, base.m, d)); setOpen(false) }

  const compact = size === 'sm'
  const label = sel ? sel.y + '.' + pad(sel.m + 1) + '.' + pad(sel.d) : ''
  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate())
  const todayDisabled = (min && todayStr < min) || (max && todayStr > max)
  const navBtn = { fontFamily: 'inherit', width: '30px', height: '30px', border: 'none', borderRadius: '9px', background: '#F1F3F7', color: '#737E92', fontSize: '15px', fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={openPicker}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: 'inherit',
          fontSize: compact ? '12.5px' : '13px', fontWeight: 600, color: sel ? '#232B3A' : '#A6ADC0',
          background: '#fff', border: '1.5px solid ' + (open || hover ? accent : '#E7EAF3'),
          borderRadius: '10px', padding: compact ? '6px 10px' : '8px 12px', cursor: 'pointer',
          transition: 'border-color .15s', minWidth: compact ? '108px' : '124px', boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: compact ? '13px' : '14px', lineHeight: 1 }}>📅</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{label || placeholder}</span>
        <span style={{ fontSize: '10px', color: '#B0B7C7' }}>▾</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 120, width: '252px', background: '#fff', border: '1px solid #EAEDF5', borderRadius: '16px', padding: '14px', boxShadow: '0 12px 32px rgba(35,43,58,.18)', animation: 'fadeUp .15s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button type="button" onClick={() => move(-1)} style={navBtn}>‹</button>
            <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-.01em' }}>{base.y}년 {base.m + 1}월</div>
            <button type="button" onClick={() => move(1)} style={navBtn}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '2px' }}>
            {WEEKDAYS.map((w) => (
              <div key={w.n} style={{ fontSize: '11px', fontWeight: 800, color: w.c, textAlign: 'center', lineHeight: '26px' }}>{w.n}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const dow = i % 7
              const selected = isSel(d)
              const today = isToday(d)
              const dstr = fmt(base.y, base.m, d)
              const disabled = (min && dstr < min) || (max && dstr > max)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && pick(d)}
                  title={disabled ? '선택할 수 없는 날짜예요' : undefined}
                  style={{
                    fontFamily: 'inherit', height: '30px', border: today && !selected && !disabled ? '1.5px solid ' + accent : '1.5px solid transparent',
                    borderRadius: '9px', cursor: disabled ? 'default' : 'pointer', fontSize: '12.5px',
                    fontWeight: selected || today ? 800 : 600,
                    color: disabled ? '#D5DAE6' : selected ? '#fff' : dow === 0 ? '#E05B5B' : dow === 6 ? '#4C6FFF' : '#4A5468',
                    background: selected ? accent : 'transparent', transition: 'all .12s',
                    textDecoration: disabled ? 'line-through' : 'none',
                  }}
                  onMouseEnter={(e) => { if (!selected && !disabled) e.currentTarget.style.background = '#F4F1FF' }}
                  onMouseLeave={(e) => { if (!selected && !disabled) e.currentTarget.style.background = 'transparent' }}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '7px', marginTop: '12px' }}>
            <button type="button" disabled={todayDisabled} onClick={() => { if (todayDisabled) return; onChange(todayStr); setOpen(false) }} style={{ flex: 1, fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: todayDisabled ? '#C9CFDC' : accent, background: todayDisabled ? '#F5F6FA' : '#F5F2FF', border: 'none', borderRadius: '9px', padding: '8px', cursor: todayDisabled ? 'default' : 'pointer' }}>오늘</button>
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} style={{ flex: 1, fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', borderRadius: '9px', padding: '8px', cursor: 'pointer' }}>지우기</button>
          </div>
        </div>
      )}
    </div>
  )
}

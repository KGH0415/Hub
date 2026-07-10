import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'
import DatePicker from '../components/DatePicker'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const DEFAULT_TEXT =
  '이번 주 금요일 17:00 전사 안전교육이 있습니다 · 7/10(금) 월급날입니다 · 사내 포털 개선 의견은 익명 게시판에 남겨주세요'
const STYLE_KEYS = ['plain', 'rainbow', 'blink']
const clsOf = (k) => (k === 'rainbow' ? 'notice-rainbow' : k === 'blink' ? 'notice-blink' : '')

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
function statusOf(n, today) {
  if (n.start && n.start > today) return '예정'
  if (n.end && n.end < today) return '종료'
  return '게시중'
}

export default function NoticeAdmin() {
  const navigate = useNavigate()
  const { userName } = useAuth()
  const notify = useToast()
  const who = userName + '님'

  const [notices, setNotices] = useLocalStorage('sd1-portal-notices', [
    { id: 'n1', text: DEFAULT_TEXT, start: '', end: '', who: '', ts: null },
  ])
  const [newText, setNewText] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newStyle, setNewStyle] = useState('plain')
  const [newPriority, setNewPriority] = useState(1)
  const [drafts, setDrafts] = useState({})
  const [page, setPage] = useState(0)

  const today = todayStr()
  const active = notices.filter((n) => statusOf(n, today) === '게시중')

  const metaLabel = (n) => {
    if (!n || !n.ts) return ''
    const t = new Date(n.ts)
    const pad = (x) => String(x).padStart(2, '0')
    return '최근 수정: ' + n.who + ' · ' + t.getFullYear() + '.' + pad(t.getMonth() + 1) + '.' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes())
  }

  const addNotice = () => {
    const text = newText.trim()
    if (!text) {
      notify('공지 내용을 입력해 주세요')
      return
    }
    if (newStart && newEnd && newEnd < newStart) {
      notify('종료일은 시작일보다 빠를 수 없어요')
      return
    }
    setNotices([{ id: 'n' + Date.now(), text, start: newStart, end: newEnd, styleType: newStyle, priority: newPriority, who, ts: Date.now() }, ...notices])
    setNewText('')
    setNewStart('')
    setNewEnd('')
    setNewStyle('plain')
    setNewPriority(1)
  }

  const setDraft = (n, patch) =>
    setDrafts((d) => ({
      ...d,
      [n.id]: { text: n.text, start: n.start, end: n.end, styleType: n.styleType || 'plain', priority: n.priority ?? 1, ...(d[n.id] || {}), ...patch },
    }))
  const saveRow = (n) => {
    const draft = drafts[n.id]
    if (!draft) {
      notify('변경된 내용이 없어요')
      return
    }
    if (!(draft.text || '').trim()) {
      notify('공지 내용을 입력해 주세요')
      return
    }
    if (draft.start && draft.end && draft.end < draft.start) {
      notify('종료일은 시작일보다 빠를 수 없어요')
      return
    }
    setNotices(notices.map((q) => (q.id === n.id ? { ...q, ...draft, who, ts: Date.now() } : q)))
    setDrafts((d) => {
      const r = { ...d }
      delete r[n.id]
      return r
    })
    notify('공지를 저장했어요')
  }
  const removeRow = (n) => setNotices(notices.filter((q) => q.id !== n.id))

  const PER = 4
  const totalPages = Math.max(1, Math.ceil(notices.length / PER))
  const curPage = Math.min(page, totalPages - 1)
  const rows = notices.slice(curPage * PER, curPage * PER + PER)
  const showPager = notices.length > PER

  return (
    <section data-screen-label="공지 관리">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#FDEFDB,#FAE2BC)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>📢</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>공지 관리</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>게시 기간을 정해 공지를 등록하면, 기간 중에만 홈 상단에 흘러요 · 우선순위가 낮을수록 먼저 표시 · 게시중 {active.length}건</p>
        </div>
      </div>

      {/* 새 공지 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '18px 20px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '18px' }}>
        <input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="새 공지 내용" style={{ border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A', width: '100%', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <PriorityStepper value={newPriority} onChange={setNewPriority} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>게시 시작</span>
            <DatePicker value={newStart} onChange={setNewStart} accent="#CE8C2C" placeholder="시작일" max={newEnd || undefined} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>종료</span>
            <DatePicker value={newEnd} onChange={setNewEnd} accent="#CE8C2C" placeholder="종료일" min={newStart || undefined} />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>스타일</span>
            {STYLE_KEYS.map((k) => {
              const cur = newStyle
              const label = k === 'plain' ? '기본' : k === 'rainbow' ? '🌈 알록달록' : '✨ 깜빡임'
              return (
                <button key={k} onClick={() => setNewStyle(k)} className={clsOf(k)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: cur === k ? 800 : 600, color: cur === k ? '#fff' : '#737E92', background: cur === k ? '#CE8C2C' : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '7px 14px', cursor: 'pointer', transition: 'all .15s' }}>
                  {label}
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1 }} />
          <HoverButton
            onClick={addNotice}
            style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#E0A34E,#CE8C2C)', border: 'none', borderRadius: '12px', padding: '10px 26px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(206,140,44,.3)', transition: 'transform .15s ease' }}
            hoverStyle={{ transform: 'translateY(-2px)' }}
          >
            ＋ 등록
          </HoverButton>
        </div>
      </div>

      {/* 공지 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map((n) => {
          const st = statusOf(n, today)
          const view = drafts[n.id] || n
          const cur = view.styleType || n.styleType || 'plain'
          const statusInk = st === '게시중' ? '#1F8A5B' : st === '예정' ? '#4C6FFF' : '#98A0B3'
          const statusBg = st === '게시중' ? '#DDF5EA' : st === '예정' ? '#E8F0FF' : '#F1F3F7'
          return (
            <div key={n.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '16px', padding: '14px 18px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '3px 11px', borderRadius: '999px', background: statusBg, color: statusInk }}>{st}</span>
                <input value={view.text} onChange={(e) => setDraft(n, { text: e.target.value })} placeholder="공지 내용" style={{ flex: 1, minWidth: '220px', border: '1.5px solid #E7EAF3', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '9px 13px', color: '#232B3A' }} />
                <HoverButton onClick={() => removeRow(n)} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <PriorityStepper value={view.priority ?? 1} onChange={(v) => setDraft(n, { priority: v })} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#98A0B3' }}>시작</span>
                  <DatePicker value={view.start || ''} onChange={(v) => setDraft(n, { start: v })} accent="#CE8C2C" placeholder="시작일" size="sm" max={view.end || undefined} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#98A0B3' }}>종료</span>
                  <DatePicker value={view.end || ''} onChange={(v) => setDraft(n, { end: v })} accent="#CE8C2C" placeholder="종료일" size="sm" min={view.start || undefined} />
                </div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {STYLE_KEYS.map((k) => (
                    <button key={k} onClick={() => setDraft(n, { styleType: k })} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: cur === k ? 800 : 600, color: cur === k ? '#fff' : '#98A0B3', background: cur === k ? '#CE8C2C' : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '5px 11px', cursor: 'pointer', transition: 'all .15s' }}>
                      {k === 'plain' ? '기본' : k === 'rainbow' ? '🌈' : '✨'}
                    </button>
                  ))}
                </div>
                <HoverButton onClick={() => saveRow(n)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: '#fff', background: '#1F8A5B', border: 'none', borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31,138,91,.25)', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>저장</HoverButton>
                <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#B0B7C7' }}>{metaLabel(n)}</span>
              </div>
            </div>
          )
        })}
        {notices.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>등록된 공지가 없어요. 위에서 추가해 보세요!</div>
        )}
      </div>

      {showPager && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '18px' }}>
          <HoverButton onClick={() => setPage(Math.max(0, curPage - 1))} style={{ fontFamily: 'inherit', width: '38px', height: '38px', border: '1px solid #EAEDF5', borderRadius: '12px', background: '#fff', color: curPage === 0 ? '#D5DAE6' : '#CE8C2C', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(35,43,58,.05)', transition: 'all .15s' }} hoverStyle={{ border: '1px solid #F0DDAB' }}>‹</HoverButton>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#737E92', minWidth: '44px', textAlign: 'center' }}>{curPage + 1} / {totalPages}</span>
          <HoverButton onClick={() => setPage(Math.min(totalPages - 1, curPage + 1))} style={{ fontFamily: 'inherit', width: '38px', height: '38px', border: '1px solid #EAEDF5', borderRadius: '12px', background: '#fff', color: curPage >= totalPages - 1 ? '#D5DAE6' : '#CE8C2C', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(35,43,58,.05)', transition: 'all .15s' }} hoverStyle={{ border: '1px solid #F0DDAB' }}>›</HoverButton>
        </div>
      )}
    </section>
  )
}

// 우선순위 스테퍼 (숫자가 작을수록 대시보드 티커에 먼저 표시)
function PriorityStepper({ value, onChange }) {
  const v = value ?? 1
  const round = { fontFamily: 'inherit', width: '24px', height: '24px', border: 'none', borderRadius: '50%', background: '#fff', color: '#737E92', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 3px rgba(35,43,58,.12)', display: 'grid', placeItems: 'center', padding: 0, lineHeight: 1 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }} title="숫자가 작을수록 대시보드 공지 티커에 먼저 표시돼요">
      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>우선순위</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#F1F3F7', borderRadius: '999px', padding: '3px' }}>
        <button type="button" onClick={() => onChange(Math.max(1, v - 1))} style={round}>−</button>
        <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#CE8C2C' }}>{v}</span>
        <button type="button" onClick={() => onChange(Math.min(99, v + 1))} style={round}>＋</button>
      </div>
    </div>
  )
}

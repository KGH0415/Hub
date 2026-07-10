import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'
import Pager from '../components/Pager'
import useAutoPage from '../hooks/useAutoPage'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const TEAMS_CHAT_URL =
  'https://teams.cloud.microsoft/l/chat/19:7d49482d57804a31bb78d35ea468eb27@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D'
const DEFAULT_DOCS = [
  { title: '주간 팀 미팅 회의록', meta: '7/7 (화) · 개발팀', type: 'PDF' },
  { title: '스프린트 계획 공유자료', meta: '7/7 (화) · 기획', type: 'PPT' },
  { title: '생산실적 대시보드 리뷰', meta: '7/4 (금) · MES', type: 'PDF' },
  { title: '분기 로드맵 초안', meta: '7/3 (목) · 전사', type: 'DOCX' },
]
const TYPE_STYLE = {
  PDF: { bg: '#FFECEC', ink: '#E05B5B' },
  PPT: { bg: '#FFF1E6', ink: '#E8823A' },
  DOCX: { bg: '#E8F0FF', ink: '#4C6FFF' },
  자료: { bg: '#F1F3F7', ink: '#737E92' },
}

export default function Docs() {
  const navigate = useNavigate()
  const [storedDocs, setDocs] = useLocalStorage('sd1-portal-docs', DEFAULT_DOCS)
  const docs = Array.isArray(storedDocs) ? storedDocs : DEFAULT_DOCS
  const { ref: listRef, pageItems, page, setPage, totalPages } = useAutoPage(docs, 74, { gap: 11, reserved: 80 })
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [teamsHover, setTeamsHover] = useState(false)

  const openTeams = () => window.open(TEAMS_CHAT_URL, '_blank')

  const startEdit = () => {
    setEditText(docs.map((d) => d.title + ' / ' + d.meta + ' · ' + d.type).join('\n'))
    setEditing(true)
  }
  const save = () => {
    const parsed = editText
      .split('\n')
      .map((line) => {
        const t = line.trim()
        if (!t) return null
        const parts = t.split('/')
        const title = parts[0].trim()
        if (!title) return null
        let meta = parts.slice(1).join('/').trim()
        let type = '자료'
        const m = meta.match(/(PDF|PPTX?|DOCX?|XLSX?)\s*$/i)
        if (m) {
          type = m[1].toUpperCase().replace('PPTX', 'PPT').replace('DOC', 'DOCX').replace('DOCXX', 'DOCX')
          meta = meta.slice(0, m.index).replace(/[·,\s]+$/, '')
        }
        return { title, meta: meta || '이번 주', type }
      })
      .filter(Boolean)
    if (!parsed.length) return
    setDocs(parsed)
    setEditing(false)
  }
  const cancel = () => setEditing(false)
  const reset = () => {
    setDocs(DEFAULT_DOCS)
    setEditing(false)
  }

  return (
    <section data-screen-label="회의자료">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E8F0FF,#D7E4FF)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>📄</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>주간회의 공유자료</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>매주 월요일 · 권택수님이 Teams에 공유하신 자료예요</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <HoverButton
            onClick={startEdit}
            style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#fff', border: '1px solid #EAEDF5', padding: '9px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all .15s' }}
            hoverStyle={{ color: '#4C6FFF', border: '1px solid #CCDAFF' }}
          >
            ✎ 자료 편집
          </HoverButton>
          <a
            href={TEAMS_CHAT_URL}
            target="_blank"
            rel="noopener"
            onMouseEnter={() => setTeamsHover(true)}
            onMouseLeave={() => setTeamsHover(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: '#4C6FFF', background: '#E8F0FF', border: '1px solid #CCDAFF', padding: '9px 16px', borderRadius: '12px', textDecoration: 'none', transition: 'transform .15s ease, box-shadow .15s ease', ...(teamsHover ? { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(76,111,255,.2)' } : null) }}
          >
            Teams 채팅 열기 ↗
          </a>
        </div>
      </div>

      {/* 자료 붙여넣기 편집 */}
      {editing && (
        <div style={{ background: '#fff', border: '2px solid #7B95FF', borderRadius: '20px', padding: '22px', marginBottom: '18px', boxShadow: '0 8px 24px rgba(76,111,255,.12)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>Teams 채팅 내용 붙여넣기</div>
            <div style={{ fontSize: '12.5px', color: '#98A0B3' }}>한 줄에 하나 · 형식: <b style={{ color: '#737E92' }}>제목 / 날짜 · 팀 · 형식(PDF·PPT·DOCX)</b></div>
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={6}
            spellCheck={false}
            style={{ fontFamily: "'Noto Sans KR',monospace", fontSize: '14px', lineHeight: 1.9, border: '1.5px solid #E7EAF3', borderRadius: '13px', padding: '14px 16px', outline: 'none', resize: 'vertical', color: '#232B3A', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
            <button onClick={save} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: '#4C6FFF', border: 'none', borderRadius: '11px', padding: '10px 22px', cursor: 'pointer', boxShadow: '0 6px 16px rgba(76,111,255,.3)' }}>게시</button>
            <button onClick={cancel} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', borderRadius: '11px', padding: '10px 18px', cursor: 'pointer' }}>취소</button>
            <div style={{ flex: 1 }} />
            <button onClick={reset} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>기본 예시로 되돌리기</button>
          </div>
        </div>
      )}

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {pageItems.map((doc, i) => {
          const ts = TYPE_STYLE[doc.type] || TYPE_STYLE['자료']
          return (
            <HoverButton
              key={i}
              onClick={openTeams}
              style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '17px 20px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', width: '100%' }}
              hoverStyle={{ transform: 'translateX(4px)', boxShadow: '0 4px 10px rgba(76,111,255,.08), 0 16px 40px rgba(35,43,58,.1)', border: '1px solid #CCDAFF' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg,#E8F0FF,#D7E4FF)', color: '#4C6FFF', display: 'grid', placeItems: 'center', fontSize: '19px', flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.01em' }}>{doc.title}</div>
                <div style={{ fontSize: '13px', color: '#8B94A8' }}>{doc.meta}</div>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: ts.bg, color: ts.ink, flexShrink: 0 }}>{doc.type}</span>
              <div style={{ color: '#B0B7C7', fontSize: '19px', flexShrink: 0 }}>↓</div>
            </HoverButton>
          )
        })}
      </div>

      <Pager page={page} totalPages={totalPages} onChange={setPage} accent="#4C6FFF" />
    </section>
  )
}

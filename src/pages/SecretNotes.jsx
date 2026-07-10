import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'
import Pager from '../components/Pager'
import useAutoPage from '../hooks/useAutoPage'
import { TEAM } from '../data/team'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const ACCENT = '#5C6BC0'
const ACCENT_BG = '#E8EAF6'

const NOW = Date.now()
const SEED = [
  { id: 's1', author: '권택수', recipients: ['가현', '민수'], text: '다음 주 인사평가 자료는 가현님, 민수님께만 먼저 공유드려요. 대외비입니다 🤫', ts: NOW - 1000 * 60 * 60 * 2 },
  { id: 's2', author: '가현', recipients: ['지영'], text: '지영님, 저번에 얘기한 건 우리끼리만 알고 있기로 해요!', ts: NOW - 1000 * 60 * 60 * 26 },
]

function timeLabel(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return m + '분 전'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '시간 전'
  return Math.floor(h / 24) + '일 전'
}

export default function SecretNotes() {
  const navigate = useNavigate()
  const { userName } = useAuth()
  const notify = useToast()
  const [stored, setNotes] = useLocalStorage('sd1-portal-secret-notes', SEED)
  const notes = Array.isArray(stored) ? stored : SEED // 다른 화면이 'null'을 저장해 오염된 경우 방어
  const [viewer, setViewer] = useState(userName)
  const [text, setText] = useState('')
  const [recipients, setRecipients] = useState([])

  const canSee = (n) => n.author === viewer || (n.recipients || []).includes(viewer)
  const visible = notes.filter(canSee).slice().sort((a, b) => b.ts - a.ts)
  const recipientOptions = TEAM.filter((m) => m !== viewer)
  const { ref: listRef, pageItems, page, setPage, totalPages } = useAutoPage(visible, 92, { gap: 10, reserved: 80 })

  const switchViewer = (m) => {
    setViewer(m)
    setRecipients([])
    setPage(0)
  }
  const toggleRecipient = (name) => setRecipients((r) => (r.includes(name) ? r.filter((x) => x !== name) : [...r, name]))

  const send = () => {
    const t = text.trim()
    if (!t) {
      notify('내용을 입력해 주세요')
      return
    }
    const rec = recipients.filter((x) => x !== viewer)
    if (!rec.length) {
      notify('공유할 팀원을 한 명 이상 선택해 주세요')
      return
    }
    setNotes([{ id: 's' + Date.now(), author: viewer, recipients: rec, text: t, ts: Date.now() }, ...notes])
    setText('')
    setRecipients([])
    setPage(0)
    notify('비밀 노트를 공유했어요 — ' + rec.join(', ') + '님만 볼 수 있어요')
  }
  const remove = (id) => setNotes(notes.filter((n) => n.id !== id))

  const chip = (name, on, onClick, title) => (
    <button
      key={name}
      onClick={onClick}
      title={title}
      style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: on ? 800 : 700, color: on ? '#fff' : ACCENT, background: on ? ACCENT : ACCENT_BG, border: 'none', borderRadius: '999px', padding: '6px 13px', cursor: 'pointer', transition: 'all .15s', boxShadow: on ? '0 4px 12px rgba(92,107,192,.35)' : 'none' }}
    >
      {name}{name === userName ? ' (나)' : ''}
    </button>
  )

  return (
    <section data-screen-label="비밀 노트">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E8EAF6,#D7DBF0)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🔒</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>비밀 노트</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>선택한 팀원에게만 보이는 쪽지</p>
        </div>
      </div>

      {/* 데모 안내 + 보기 전환 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '15px 18px', boxShadow: cardShadow, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ fontSize: '12.5px', color: '#8A90A6', lineHeight: 1.6 }}>
          🔒 데모: 실제 서버 접근제어가 아니라, 고른 팀원에게만 보이도록 시뮬레이션해요. 아래 <b style={{ color: ACCENT }}>보기</b>를 바꾸면 그 팀원 입장에서 목록이 어떻게 필터링되는지 확인할 수 있어요.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#737E92', marginRight: '2px' }}>👀 보기</span>
          {TEAM.map((m) => chip(m, viewer === m, () => switchViewer(m), m + '(으)로 보기'))}
        </div>
      </div>

      {/* 작성 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#98A0B3' }}>작성자 <b style={{ color: ACCENT }}>{viewer}</b></div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="선택한 팀원에게만 보이는 쪽지를 남겨요"
          spellCheck={false}
          style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.7, border: '1.5px solid #E7EAF3', borderRadius: '13px', padding: '12px 15px', outline: 'none', resize: 'vertical', color: '#232B3A', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', marginRight: '2px' }}>받는 사람</span>
          {recipientOptions.map((m) => chip(m, recipients.includes(m), () => toggleRecipient(m)))}
          <div style={{ flex: 1 }} />
          <HoverButton
            onClick={send}
            style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6E7AD0,#5C6BC0)', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(92,107,192,.3)', transition: 'transform .15s ease' }}
            hoverStyle={{ transform: 'translateY(-2px)' }}
          >
            🔒 공유
          </HoverButton>
        </div>
      </div>

      {/* 목록 */}
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pageItems.map((n) => (
          <div key={n.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderLeft: '3px solid ' + ACCENT, borderRadius: '15px', padding: '13px 17px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: ACCENT_BG, color: ACCENT, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '12.5px', flexShrink: 0 }}>{n.author.charAt(0)}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#4A5468' }}>{n.author}{n.author === viewer ? ' (나)' : ''}</span>
              <span style={{ fontSize: '13px', color: '#B0B7C7' }}>→</span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {n.recipients.map((r) => (
                  <span key={r} style={{ fontSize: '11.5px', fontWeight: 800, color: r === viewer ? '#fff' : ACCENT, background: r === viewer ? ACCENT : ACCENT_BG, padding: '2px 9px', borderRadius: '999px' }}>{r}{r === viewer ? ' (나)' : ''}</span>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: '11.5px', color: '#B0B7C7', flexShrink: 0 }}>{timeLabel(n.ts)}</span>
              {n.author === viewer && (
                <HoverButton onClick={() => remove(n.id)} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0, transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
              )}
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#232B3A', whiteSpace: 'pre-wrap', paddingLeft: '37px' }}>{n.text}</div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600, lineHeight: 1.7 }}>
            {viewer}님에게 공유된 비밀 노트가 없어요.<br />
            <span style={{ fontSize: '12.5px', fontWeight: 500 }}>위에서 팀원을 골라 첫 비밀 노트를 남겨보세요.</span>
          </div>
        )}
      </div>

      <Pager page={page} totalPages={totalPages} onChange={setPage} accent="#5C6BC0" />
    </section>
  )
}

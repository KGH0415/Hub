import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'

function todayKeyOf() {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

// 오늘 하루 유효한 야식 주문판. 팀원이 각자 메뉴를 추가하고 마감시간이 지나면 잠김.
export default function Snack() {
  const navigate = useNavigate()
  const { userName } = useAuth()
  const notify = useToast()
  const myName = userName

  const [stored, setStored] = useLocalStorage('sd1-portal-snack-session', null)
  const [storeInput, setStoreInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('21:00')
  const [editing, setEditing] = useState(false)
  const [editStore, setEditStore] = useState('')
  const [editDeadline, setEditDeadline] = useState('21:00')
  const [confirmClose, setConfirmClose] = useState(false)
  const closeT = useRef(null)

  const todayKey = todayKeyOf()
  const session = stored && stored.date === todayKey ? stored : null
  const save = (next) => setStored(next)
  const orders = session ? session.orders : []

  let closed = false
  let deadlineLabel = ''
  if (session) {
    const [hh, mm] = session.deadline.split(':').map(Number)
    const now = new Date()
    const nowM = now.getHours() * 60 + now.getMinutes()
    const dlM = hh * 60 + mm
    closed = nowM >= dlM
    if (closed) deadlineLabel = '⏰ 마감됨 (' + session.deadline + ')'
    else {
      const left = dlM - nowM
      deadlineLabel = session.deadline + ' 마감 · ' + (left >= 60 ? Math.floor(left / 60) + '시간 ' + (left % 60) + '분 남음' : left + '분 남음')
    }
  }
  const snackOpen = !!session && !closed

  const openSession = () => {
    const store = storeInput.trim()
    if (!store) {
      notify('가게 이름을 입력해 주세요')
      return
    }
    const dl = deadlineInput || '21:00'
    const [dh, dm] = dl.split(':').map(Number)
    const nowD = new Date()
    if (dh * 60 + dm <= nowD.getHours() * 60 + nowD.getMinutes()) {
      notify('⏰ 마감시간이 이미 지났어요 — 미래 시간으로 선택해 주세요')
      return
    }
    save({ date: todayKey, store, deadline: dl, opener: myName, orders: [] })
    setStoreInput('')
  }

  const startEdit = () => {
    setEditing(true)
    setEditStore(session.store)
    setEditDeadline(session.deadline)
  }
  const saveEdit = () => {
    const store = editStore.trim()
    if (!store) {
      notify('가게 이름을 입력해 주세요')
      return
    }
    const dl = editDeadline || session.deadline
    const [eh, em] = dl.split(':').map(Number)
    const nowE = new Date()
    if (eh * 60 + em <= nowE.getHours() * 60 + nowE.getMinutes()) {
      notify('⏰ 마감시간이 이미 지났어요 — 미래 시간으로 선택해 주세요')
      return
    }
    save({ ...session, store, deadline: dl })
    setEditing(false)
    notify('주문 정보를 수정했어요')
  }

  const closeSession = () => {
    if (confirmClose) {
      clearTimeout(closeT.current)
      save(null)
      setEditing(false)
      setConfirmClose(false)
      notify('오늘 주문판을 삭제했어요')
    } else {
      setConfirmClose(true)
      notify('⚠️ 주문 내역까지 모두 삭제돼요 — 한 번 더 누르면 삭제')
      clearTimeout(closeT.current)
      closeT.current = setTimeout(() => setConfirmClose(false), 4000)
    }
  }

  const addRow = () => {
    if (!session || closed) return
    save({ ...session, orders: [...orders, { id: 'o' + Date.now(), who: myName, menu: '', note: '', mine: true }] })
  }
  const setOrder = (id, patch) => save({ ...session, orders: orders.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
  const removeOrder = (id) => save({ ...session, orders: orders.filter((q) => q.id !== id) })

  const copySnacks = () => {
    const text =
      '🌙 야식 주문 — ' + session.store + ' (' + session.deadline + ' 마감)\n' +
      orders.filter((o) => o.menu.trim()).map((o) => '- ' + o.who + ': ' + o.menu + (o.note ? ' (' + o.note + ')' : '')).join('\n')
    try {
      navigator.clipboard.writeText(text)
      notify('주문 목록을 복사했어요 — 채팅에 붙여넣으세요')
    } catch {
      notify('복사에 실패했어요', 'error')
    }
  }

  return (
    <section data-screen-label="야식 주문하기">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E8EAF8,#D6DAF2)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🌙</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>야식 주문하기</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>먹고 싶은 야식을 접수해 주세요 · 총무가 모아서 한 번에 주문해요</p>
        </div>
      </div>

      {/* 오늘 주문이 아직 없을 때: 주문 열기 */}
      {!session && (
        <div style={{ background: '#fff', border: '2px solid #8B95CE', borderRadius: '20px', padding: '22px', boxShadow: '0 8px 24px rgba(85,96,164,.12)', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800 }}>🌙 오늘의 야식 주문 열기</div>
          <div style={{ fontSize: '12.5px', color: '#98A0B3' }}>첫 번째 사람이 가게와 마감시간을 정하면, 팀원들이 각자 메뉴를 추가할 수 있어요. 주문은 매일 초기화돼요.</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={storeInput} onChange={(e) => setStoreInput(e.target.value)} placeholder="가게 이름 (예: BHC 창원점)" style={{ flex: 2, minWidth: '200px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#737E92' }}>마감</span>
              <input type="time" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} style={{ border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '10px 12px', color: '#232B3A' }} />
            </div>
            <HoverButton
              onClick={openSession}
              style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6B77BE,#5560A4)', border: 'none', borderRadius: '12px', padding: '11px 26px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(85,96,164,.3)', transition: 'transform .15s ease' }}
              hoverStyle={{ transform: 'translateY(-2px)' }}
            >
              주문 열기
            </HoverButton>
          </div>
        </div>
      )}

      {/* 오늘 주문 진행 중 */}
      {session && (
        <>
          <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '18px 20px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#E8EAF8', display: 'grid', placeItems: 'center', fontSize: '20px', flexShrink: 0 }}>🏪</span>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '16.5px', fontWeight: 900, letterSpacing: '-.01em' }}>{session.store}</div>
              <div style={{ fontSize: '12.5px', color: '#98A0B3' }}>{session.opener}님이 열었어요 · 주문 {orders.length}건</div>
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 800, padding: '6px 14px', borderRadius: '999px', background: closed ? '#F1F3F7' : '#DDF5EA', color: closed ? '#98A0B3' : '#1F8A5B' }}>{deadlineLabel}</span>
            {orders.length > 0 && (
              <HoverButton onClick={copySnacks} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#5560A4', background: '#E8EAF8', border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.04)' }}>📋 주문 복사</HoverButton>
            )}
            <HoverButton onClick={startEdit} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#5560A4', background: '#E8EAF8' }}>✎ 수정</HoverButton>
            <HoverButton onClick={closeSession} title="주문판 닫기 (삭제)" style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#B0B7C7', background: '#F1F3F7', border: 'none', padding: '8px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#fff', background: '#E05B5B' }}>✕ 삭제</HoverButton>
          </div>

          {/* 가게/마감 수정 */}
          {editing && (
            <div style={{ background: '#fff', border: '2px solid #8B95CE', borderRadius: '18px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(85,96,164,.12)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <input value={editStore} onChange={(e) => setEditStore(e.target.value)} placeholder="가게 이름" style={{ flex: 2, minWidth: '200px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '10px 14px', color: '#232B3A' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#737E92' }}>마감</span>
                <input type="time" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} style={{ border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '9px 12px', color: '#232B3A' }} />
              </div>
              <button onClick={saveEdit} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6B77BE,#5560A4)', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(85,96,164,.3)' }}>저장</button>
              <button onClick={() => setEditing(false)} style={{ fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer' }}>취소</button>
            </div>
          )}

          {/* 주문 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {orders.map((o) => (
              <div key={o.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '15px', padding: '11px 16px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0, minWidth: '90px' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E8EAF8', color: '#5560A4', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '12.5px' }}>{(o.who || '?').charAt(0)}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#4A5468' }}>{o.who}</span>
                </span>
                <input value={o.menu} onChange={(e) => setOrder(o.id, { menu: e.target.value })} placeholder="메뉴 이름" style={{ flex: 2, minWidth: '160px', border: '1.5px solid #E7EAF3', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '9px 13px', color: '#232B3A', background: '#fff' }} />
                <input value={o.note} onChange={(e) => setOrder(o.id, { note: e.target.value })} placeholder="요청사항 (선택)" style={{ flex: 1, minWidth: '130px', border: '1.5px solid #E7EAF3', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '9px 13px', color: '#232B3A', background: '#fff' }} />
                {o.mine && (
                  <HoverButton onClick={() => removeOrder(o.id)} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0, transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
                )}
              </div>
            ))}

            {snackOpen && (
              <HoverButton
                onClick={addRow}
                style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#5560A4', background: '#E8EAF8', border: '2px dashed #B7BEE4', borderRadius: '15px', padding: '13px', cursor: 'pointer', transition: 'all .15s ease' }}
                hoverStyle={{ background: '#DCE0F5', transform: 'translateY(-1px)' }}
              >
                ＋ 내 주문 추가 ({myName})
              </HoverButton>
            )}
            {closed && (
              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#5560A4', padding: '10px' }}>⏰ 주문이 마감됐어요</div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

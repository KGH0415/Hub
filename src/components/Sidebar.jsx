import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './Toast'
import { HoverButton } from './ui'

// 원본 navItems(라인 2985-3007). route가 있으면 내부 이동, ext면 외부/토스트.
export const NAV_ITEMS = [
  { key: 'home', route: '/', name: '홈', icon: '🏠', color: '#7C5CFC', bg: '#EFE9FF' },
  { key: 'todo', route: '/todo', name: '나의 TODOLIST', icon: '✅', color: '#7C5CFC', bg: '#EFE9FF' },
  { key: 'noticeadmin', route: '/notice-admin', name: '공지 관리', icon: '📢', color: '#CE8C2C', bg: '#FDEFDB' },
  { key: 'meal', route: '/meal', name: '오늘의 식단', icon: '🍚', color: '#E8823A', bg: '#FFF1E6' },
  { key: 'docs', route: '/docs', name: '주간 회의자료', icon: '📄', color: '#4C6FFF', bg: '#E8F0FF' },
  { key: 'board', route: '/board', name: '익명 게시판', icon: '💬', color: '#3AA6B9', bg: '#E3F5F8' },
  { key: 'maint', route: '/maint', name: '유지보수 내역', icon: '📊', color: '#217346', bg: '#E2F2E9' },
  { key: 'gitlab', route: '/gitlab', name: 'GitLab 커밋 이력', icon: '🦊', color: '#E2542C', bg: '#FDEAE2' },
  { key: 'snack', route: '/snack', name: '야식 주문하기', icon: '🌙', color: '#5560A4', bg: '#E8EAF8' },
  { key: 'resources', route: '/resources', name: '자료실', icon: '🗂️', color: '#1E9BAE', bg: '#E3F5F8' },
  { key: 'random', route: '/random', name: '결정 도우미', icon: '🎲', color: '#E05B8B', bg: '#FFE3F0' },
  { key: 'claude', route: '/claude', name: 'Claude 사용량', icon: '🤖', color: '#D97757', bg: '#FBEAE3' },
  { key: 'secret', route: '/secret', name: '비밀 노트', icon: '🔒', color: '#5C6BC0', bg: '#E8EAF6' },
  { key: 'wakbu', ext: true, name: '왁뿌MAP', icon: '🗺️', color: '#0F9D9F', bg: '#DFF5F5' },
  { key: 'wiki', ext: true, name: '사내 위키', icon: '📚', color: '#7C5CFC', bg: '#EFE9FF' },
  { key: 'meta', ext: true, name: '사내 메타버스', icon: '🌐', color: '#2FA36B', bg: '#E4F7F0' },
]

const WAKBU_URL = 'http://localhost:3300/3d'

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { uid } = useAuth()
  const notify = useToast()
  const [navOrder, setNavOrder] = useLocalStorage('sd1-portal-navorder-' + uid, [])
  const dragNav = useRef(null)

  const handleGo = (n) => {
    if (n.key === 'wiki') notify('사내 위키 — 실제 서비스에서는 새 탭으로 연결돼요')
    else if (n.key === 'meta') window.open(WAKBU_URL, '_blank')
    else if (n.key === 'wakbu') window.open(WAKBU_URL, '_blank')
    else navigate(n.route)
  }

  // 드래그 재정렬: 저장된 순서(유효 키만) + 누락된 키 append
  const keys = NAV_ITEMS.map((n) => n.key)
  const seq = navOrder.filter((k) => keys.includes(k)).concat(keys.filter((k) => !navOrder.includes(k)))
  const ordered = seq.map((k) => NAV_ITEMS.find((n) => n.key === k))
  const onNavDrop = (key) => {
    const from = dragNav.current
    dragNav.current = null
    if (!from || from === key) return
    const next = seq.filter((x) => x !== from)
    next.splice(next.indexOf(key), 0, from)
    setNavOrder(next)
  }

  return (
    <>
      <div style={{ width: '214px', flexShrink: 0 }} />
      <nav className="sidebar-nav" style={{ width: '192px', position: 'fixed', left: '44px', top: '80px', bottom: '24px', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '20px', padding: '12px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 10px 28px rgba(35,43,58,.08)', display: 'flex', flexDirection: 'column', gap: '1px', zIndex: 40, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {ordered.map((n) => {
          const active = !n.ext && n.route === pathname
          return (
            <HoverButton
              key={n.key}
              onClick={() => handleGo(n)}
              draggable
              onDragStart={() => { dragNav.current = n.key }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onNavDrop(n.key) }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: active ? 800 : 600, color: active ? n.color : '#5A6478', background: active ? n.bg : 'transparent', border: 'none', borderRadius: '13px', padding: '7px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s ease', width: '100%' }}
              hoverStyle={{ background: active ? n.bg : '#F1F3F9' }}
            >
              <span style={{ fontSize: '17px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
              {n.ext && <span style={{ fontSize: '11px', color: '#B0B7C7' }}>↗</span>}
            </HoverButton>
          )
        })}
      </nav>
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useAuth } from '../context/AuthContext'
import { usePortal } from '../context/PortalContext'
import { useToast } from './Toast'
import { HoverButton } from './ui'
import logo from '../assets/company-logo.png'

// 원형 아이콘 버튼 공통 스타일 (반투명)
const roundBtn = {
  fontFamily: 'inherit',
  fontSize: '14px',
  background: 'rgba(255,255,255,.18)',
  border: '1px solid rgba(255,255,255,.35)',
  borderRadius: '999px',
  width: '32px',
  height: '32px',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  transition: 'all .15s',
  padding: 0,
}
// 밝은 배경 원형 버튼 (Teams / 인사)
const roundBtnLight = {
  ...roundBtn,
  background: 'rgba(255,255,255,.9)',
  border: '1px solid rgba(255,255,255,.5)',
}

export default function Topbar() {
  const navigate = useNavigate()
  const { userName, userInitial, logout } = useAuth()
  const { darkMode, toggleDark } = usePortal()
  const notify = useToast()
  const [shotBusy, setShotBusy] = useState(false)

  const takeScreenshot = () => {
    if (shotBusy || typeof html2canvas === 'undefined') return
    setShotBusy(true)
    setTimeout(() => {
      html2canvas(document.body, {
        useCORS: true,
        backgroundColor: '#E2E1F4',
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        x: window.scrollX,
        y: window.scrollY,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      })
        .then((canvas) => {
          const d = new Date()
          const pad = (n) => String(n).padStart(2, '0')
          const name =
            '포털_' +
            d.getFullYear() +
            pad(d.getMonth() + 1) +
            pad(d.getDate()) +
            '_' +
            pad(d.getHours()) +
            pad(d.getMinutes()) +
            pad(d.getSeconds()) +
            '.png'
          const a = document.createElement('a')
          a.href = canvas.toDataURL('image/png')
          a.download = name
          a.click()
          setShotBusy(false)
          notify('스크린샷이 저장됐어요 — ' + name)
        })
        .catch(() => {
          setShotBusy(false)
          notify('캡처에 실패했어요', 'error')
        })
    }, 60)
  }

  const openTeams = () => window.open('https://teams.cloud.microsoft/', '_blank')
  const openHr = () => window.open('https://ipeople.ctr.co.kr/', '_blank')

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'linear-gradient(100deg,#7174D5 0%,#866FD6 50%,#A575D3 100%)', borderBottom: '1px solid rgba(255,255,255,.3)', boxShadow: '0 6px 24px rgba(124,92,252,.2)' }}>
      <div style={{ margin: '0 auto', padding: '13px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', padding: 0 }}
        >
          <img src={logo} alt="CTR 로고" style={{ width: '36px', height: '36px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(35,43,58,.18)', display: 'block' }} />
          <span style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-.01em', color: '#fff' }}>시스템 개발 1팀 포털</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px', color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>
          <span>{userName}님</span>
          <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#DDF5EA,#BFEBD7)', color: '#1F8A5B', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(35,43,58,.1)' }}>{userInitial}</span>
          <HoverButton
            onClick={logout}
            style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '6px 13px', cursor: 'pointer', transition: 'all .15s' }}
            hoverStyle={{ color: '#fff', background: 'rgba(255,255,255,.22)' }}
          >
            로그아웃
          </HoverButton>
          <HoverButton onClick={toggleDark} title="다크 모드 전환" style={roundBtn} hoverStyle={{ background: 'rgba(255,255,255,.32)' }}>
            {darkMode ? '☀️' : '🌙'}
          </HoverButton>
          <HoverButton onClick={takeScreenshot} title="화면 캡처 후 이미지 저장" style={roundBtn} hoverStyle={{ background: 'rgba(255,255,255,.32)' }}>
            📸
          </HoverButton>
          <HoverButton onClick={openTeams} title="내 Teams 열기" style={roundBtnLight} hoverStyle={{ background: '#fff' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="13" height="13" rx="3" fill="#6264A7" />
              <text x="8.5" y="16" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: '#fff', fontFamily: "'Noto Sans KR',sans-serif" }}>T</text>
              <circle cx="18.5" cy="9" r="3.4" fill="#8B8CC7" />
              <path d="M14.5 20c0-2.6 1.8-4.4 4-4.4s4 1.8 4 4.4" fill="#8B8CC7" />
            </svg>
          </HoverButton>
          <HoverButton onClick={openHr} title="사내 인사시스템 (iPeople)" style={roundBtnLight} hoverStyle={{ background: '#fff' }}>
            👥
          </HoverButton>
        </div>
      </div>
    </div>
  )
}

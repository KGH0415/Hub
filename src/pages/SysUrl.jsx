import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton, HoverDiv } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const DEFAULT_LINKS = [
  { id: 's1', name: 'MES', url: '' },
  { id: 's2', name: 'ERP', url: '' },
  { id: 's3', name: '그룹웨어', url: '' },
]

export default function SysUrl() {
  const navigate = useNavigate()
  const notify = useToast()
  const [links, setLinks] = useLocalStorage('sd1-portal-syslinks', DEFAULT_LINKS)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const addSysLink = () => {
    const name = newName.trim()
    if (!name) return
    let url = newUrl.trim()
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
    setLinks([...links, { id: 's' + Date.now(), name, url }])
    setNewName('')
    setNewUrl('')
  }
  const remove = (id) => setLinks(links.filter((q) => q.id !== id))
  const open = (l) => {
    if (l.url) window.open(l.url, '_blank')
    else notify(l.name + ' — URL이 아직 등록되지 않았어요')
  }

  return (
    <section data-screen-label="시스템 접속URL">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#FFF6DE,#FBEDC4)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🔗</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>시스템 접속URL</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>자주 쓰는 사내 시스템을 한 번에 열어요</p>
        </div>
      </div>

      {/* 링크 추가 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '18px 20px', boxShadow: cardShadow, display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="시스템 이름 (예: MES)" style={{ flex: 1, minWidth: '140px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https:// 주소" style={{ flex: 2, minWidth: '200px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
        <HoverButton
          onClick={addSysLink}
          style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#D9AC46,#C99A2E)', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(201,154,46,.3)', transition: 'transform .15s ease' }}
          hoverStyle={{ transform: 'translateY(-2px)' }}
        >
          ＋ 추가
        </HoverButton>
      </div>

      {/* 링크 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '13px' }}>
        {links.map((l) => {
          const urlLabel = l.url ? l.url.replace(/^https?:\/\//i, '') : 'URL 미설정 — ✕ 눌러 지우고 다시 추가하세요'
          return (
            <HoverDiv
              key={l.id}
              style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '17px 19px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform .15s ease, box-shadow .15s ease' }}
              hoverStyle={{ transform: 'translateY(-3px)', boxShadow: '0 4px 12px rgba(201,154,46,.1), 0 16px 40px rgba(35,43,58,.1)' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg,#FFF6DE,#FBEDC4)', color: '#C99A2E', display: 'grid', placeItems: 'center', fontSize: '19px', flexShrink: 0 }}>🖥️</div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.01em' }}>{l.name}</div>
                <div style={{ fontSize: '12.5px', color: '#98A0B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urlLabel}</div>
              </div>
              <HoverButton
                onClick={() => open(l)}
                style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: l.url ? '#fff' : '#B0B7C7', background: l.url ? '#C99A2E' : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '8px 16px', cursor: 'pointer', flexShrink: 0, transition: 'transform .15s' }}
                hoverStyle={{ transform: 'scale(1.05)' }}
              >
                열기 ↗
              </HoverButton>
              <HoverButton
                onClick={() => remove(l.id)}
                style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px', transition: 'color .15s' }}
                hoverStyle={{ color: '#E05B5B' }}
              >
                ✕
              </HoverButton>
            </HoverDiv>
          )
        })}
      </div>
      {links.length === 0 && (
        <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>등록된 시스템이 없어요. 위에서 추가해 보세요!</div>
      )}
    </section>
  )
}

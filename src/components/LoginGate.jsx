import { useAuth } from '../context/AuthContext'
import { HoverButton } from './ui'
import logo from '../assets/company-logo.png'

function MsLogo({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21">
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  )
}

export default function LoginGate({ children }) {
  const {
    loggedIn,
    loginStep,
    ssoConnecting,
    rememberMe,
    startSso,
    pickSsoAccount,
    backToStart,
    onRemember,
  } = useAuth()

  if (loggedIn) return children

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgb(255, 255, 255)', borderRadius: '28px', padding: '40px 36px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 24px 64px rgba(35,43,58,.14)', animation: 'fadeUp .45s ease both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          <img src={logo} alt="CTR 로고" style={{ width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 10px 24px rgba(35,43,58,.2)', display: 'block' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-.02em' }}>시스템 개발 1팀 포털</div>
            <div style={{ fontSize: '13.5px', color: '#98A0B3', marginTop: '4px' }}>회사 계정으로 로그인해 주세요</div>
          </div>
        </div>

        {loginStep === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <HoverButton
              onClick={startSso}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '11px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#232B3A', background: 'rgb(255, 255, 255)', border: '1.5px solid #D5DAE6', borderRadius: '13px', padding: '14px', cursor: 'pointer', transition: 'all .15s ease', width: '100%' }}
              hoverStyle={{ border: '1.5px solid #7C5CFC', boxShadow: '0 8px 20px rgba(124,92,252,.14)' }}
            >
              <MsLogo />
              Microsoft로 계속하기
            </HoverButton>
            <div style={{ fontSize: '12.5px', color: '#98A0B3', textAlign: 'center' }}>회사 계정(@ctr.co.kr)으로 자동 연결돼요</div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', cursor: 'pointer', padding: '6px 2px 0', userSelect: 'none' }}>
              <input type="checkbox" checked={rememberMe} onChange={onRemember} style={{ width: '17px', height: '17px', accentColor: '#7C5CFC', cursor: 'pointer', margin: 0 }} />
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#737E92' }}>로그인 상태 유지</span>
            </label>
          </div>
        )}

        {loginStep === 'ms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#737E92' }}>
              <MsLogo size={15} />
              Microsoft · 계정 선택
            </div>
            <HoverButton
              onClick={pickSsoAccount}
              style={{ display: 'flex', alignItems: 'center', gap: '13px', fontFamily: 'inherit', textAlign: 'left', background: 'rgb(247, 248, 252)', border: '1.5px solid #E7EAF3', borderRadius: '13px', padding: '13px 15px', cursor: 'pointer', transition: 'all .15s ease', width: '100%' }}
              hoverStyle={{ border: '1.5px solid #7C5CFC', background: '#F3F0FF' }}
            >
              <span style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#DDF5EA,#BFEBD7)', color: '#1F8A5B', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>가</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#232B3A' }}>가현</span>
                <span style={{ fontSize: '12.5px', color: '#98A0B3' }}>103895@ctr.co.kr</span>
              </span>
            </HoverButton>
            {ssoConnecting && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', fontSize: '13px', fontWeight: 600, color: '#7C5CFC', padding: '4px' }}>
                <span style={{ width: '15px', height: '15px', border: '2.5px solid #E2D7FF', borderTopColor: '#7C5CFC', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                CTR 계정으로 연결 중…
              </div>
            )}
            <HoverButton
              onClick={backToStart}
              style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#98A0B3', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', alignSelf: 'flex-start' }}
              hoverStyle={{ color: '#232B3A' }}
            >
              ← 뒤로
            </HoverButton>
          </div>
        )}

        <p style={{ margin: '22px 0 0', fontSize: '12px', color: '#B0B7C7', textAlign: 'center', lineHeight: 1.6 }}>
          💡 프로토타입 시뮬레이션이에요. 실서비스에서는 이 자리에<br />Microsoft 365 SSO(MSAL)가 그대로 연결돼요.
        </p>
      </div>
    </div>
  )
}

import { createContext, useContext, useState, useRef, useEffect } from 'react'

const AuthContext = createContext(null)

// 로그인 상태·SSO 시뮬레이션·로그아웃을 어디서든 꺼내 쓰는 훅
export function useAuth() {
  return useContext(AuthContext)
}

const USER_NAME = '가현'
const SSO_ID = '103895'

// 마운트 시 저장된 세션을 복원 (원본 componentDidMount 세션 복원 로직)
function initialAuth() {
  try {
    const saved = localStorage.getItem('sd1-portal-session')
    if (saved) return { loggedIn: true, loginId: saved, rememberMe: true }
    const temp = sessionStorage.getItem('sd1-portal-session')
    if (temp) return { loggedIn: true, loginId: temp, rememberMe: false }
    const rememberId = localStorage.getItem('sd1-portal-remember-id')
    if (rememberId) return { loggedIn: false, loginId: rememberId, rememberMe: true }
  } catch {
    /* 무시 */
  }
  return { loggedIn: false, loginId: '', rememberMe: true }
}

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(initialAuth)
  const [loginStep, setLoginStep] = useState('start') // 'start' | 'ms'
  const [ssoConnecting, setSsoConnecting] = useState(false)
  const ssoT = useRef(null)

  useEffect(() => () => clearTimeout(ssoT.current), [])

  const startSso = () => {
    setSsoConnecting(false)
    setLoginStep('ms')
  }

  const backToStart = () => {
    clearTimeout(ssoT.current)
    setSsoConnecting(false)
    setLoginStep('start')
  }

  const finishSso = () => {
    try {
      if (auth.rememberMe) {
        localStorage.setItem('sd1-portal-session', SSO_ID)
        localStorage.setItem('sd1-portal-remember-id', SSO_ID)
      } else {
        sessionStorage.setItem('sd1-portal-session', SSO_ID)
      }
    } catch {
      /* 무시 */
    }
    setAuth((a) => ({ ...a, loggedIn: true, loginId: SSO_ID }))
    setLoginStep('start')
    setSsoConnecting(false)
  }

  const pickSsoAccount = () => {
    if (ssoConnecting) return
    setSsoConnecting(true)
    clearTimeout(ssoT.current)
    ssoT.current = setTimeout(finishSso, 1400)
  }

  const onRemember = (e) => setAuth((a) => ({ ...a, rememberMe: e.target.checked }))

  const logout = () => {
    try {
      localStorage.removeItem('sd1-portal-session')
      sessionStorage.removeItem('sd1-portal-session')
    } catch {
      /* 무시 */
    }
    setAuth((a) => ({ ...a, loggedIn: false }))
  }

  const value = {
    loggedIn: auth.loggedIn,
    loginId: auth.loginId,
    uid: auth.loginId || 'anon',
    userName: USER_NAME,
    userInitial: USER_NAME.charAt(0),
    rememberMe: auth.rememberMe,
    loginStep,
    ssoConnecting,
    startSso,
    backToStart,
    pickSsoAccount,
    onRemember,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

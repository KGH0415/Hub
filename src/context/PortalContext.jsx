import { createContext, useContext, useEffect } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import useWeather from '../hooks/useWeather'
import useNews from '../hooks/useNews'
import useClock from '../hooks/useClock'

const PortalContext = createContext(null)

// 다크모드·날씨·뉴스 등 여러 화면이 공유하는 전역 상태
export function usePortal() {
  return useContext(PortalContext)
}

export default function PortalProvider({ children }) {
  const [dark, setDark] = useLocalStorage('sd1-portal-dark', '0', { raw: true })
  const weather = useWeather()
  const news = useNews()
  useClock(30000) // 시계/카운트다운 30초마다 갱신

  useEffect(() => {
    if (dark === '1') document.documentElement.setAttribute('data-dark', '')
    else document.documentElement.removeAttribute('data-dark')
  }, [dark])

  const darkMode = dark === '1'
  const toggleDark = () => setDark(darkMode ? '0' : '1')

  const value = { darkMode, toggleDark, weather, news }
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

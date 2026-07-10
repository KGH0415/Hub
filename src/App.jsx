import { Routes, Route, useLocation } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import PortalProvider from './context/PortalContext'
import { ToastProvider } from './components/Toast'
import LoginGate from './components/LoginGate'
import Background from './components/Background'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Meal from './pages/Meal'
import Docs from './pages/Docs'
import Board from './pages/Board'
import NoticeAdmin from './pages/NoticeAdmin'
import Todo from './pages/Todo'
import Maintenance from './pages/Maintenance'
import Gitlab from './pages/Gitlab'
import Snack from './pages/Snack'
import Random from './pages/Random'
import ClaudeUsage from './pages/ClaudeUsage'
import SecretNotes from './pages/SecretNotes'
import Resources from './pages/Resources'
import './App.css'

function Layout() {
  const { pathname } = useLocation()
  const showSidebar = pathname !== '/'
  return (
    <>
      <Background />
      <Topbar />
      <main style={{ margin: '0 auto', padding: '16px 44px 24px', position: 'relative', zIndex: 1, display: 'flex', gap: '22px', alignItems: 'flex-start' }}>
        {showSidebar && <Sidebar />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meal" element={<Meal />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/board" element={<Board />} />
            <Route path="/notice-admin" element={<NoticeAdmin />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/maint" element={<Maintenance />} />
            <Route path="/gitlab" element={<Gitlab />} />
            <Route path="/snack" element={<Snack />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/random" element={<Random />} />
            <Route path="/claude" element={<ClaudeUsage />} />
            <Route path="/secret" element={<SecretNotes />} />
            <Route path="*" element={<div style={{ padding: '60px', textAlign: 'center', color: '#98A0B3' }}>페이지를 찾을 수 없습니다.</div>} />
          </Routes>
        </div>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PortalProvider>
        <ToastProvider>
          <LoginGate>
            <Layout />
          </LoginGate>
        </ToastProvider>
      </PortalProvider>
    </AuthProvider>
  )
}

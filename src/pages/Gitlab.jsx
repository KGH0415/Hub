import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return m + '분 전'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '시간 전'
  return Math.floor(h / 24) + '일 전'
}

export default function Gitlab() {
  const navigate = useNavigate()
  const notify = useToast()
  const [url, setUrl] = useLocalStorage('sd1-portal-gitlabUrl', '', { raw: true })
  const [token, setToken] = useLocalStorage('sd1-portal-gitlabToken', '', { raw: true })
  const [projects, setProjects] = useLocalStorage('sd1-portal-gitlabProjects', [])
  const [newProj, setNewProj] = useState('')
  const [settingsToggled, setSettingsToggled] = useState(false)
  const [commits, setCommits] = useState({}) // { path: { loading | commits | error } }

  const settingsOpen = settingsToggled || !url

  const fetchCommits = (u, t, path) => {
    setCommits((c) => ({ ...c, [path]: { loading: true } }))
    const base = u.replace(/\/+$/, '')
    const api = base + '/api/v4/projects/' + encodeURIComponent(path) + '/repository/commits?per_page=5'
    fetch(api, { headers: t ? { 'PRIVATE-TOKEN': t } : {} })
      .then((r) => {
        if (!r.ok) throw new Error(r.status)
        return r.json()
      })
      .then((list) => setCommits((c) => ({ ...c, [path]: { commits: list } })))
      .catch((err) => setCommits((c) => ({ ...c, [path]: { error: String(err.message || err) } })))
  }

  const saveGitlab = () => {
    const u = url.trim()
    const t = token.trim()
    setUrl(u)
    setToken(t)
    setSettingsToggled(false)
    projects.forEach((p) => fetchCommits(u, t, p))
    notify('GitLab 연결 정보를 저장했어요')
  }

  const addProj = () => {
    const path = newProj.trim().replace(/^\/+|\/+$/g, '')
    if (!path) return
    if (projects.includes(path)) {
      setNewProj('')
      return
    }
    setProjects([...projects, path])
    setNewProj('')
    if (url) fetchCommits(url, token, path)
  }

  const removeProj = (path) => setProjects(projects.filter((q) => q !== path))

  const projectViews = projects.map((path) => {
    const st = commits[path] || {}
    let status = 'GitLab 주소를 연결하면 커밋을 불러와요'
    if (url && st.loading) status = '커밋 불러오는 중…'
    else if (st.error) status = '직접 연결 실패 (' + st.error + ') — CORS 차단일 수 있어요. 커밋 페이지 ↗로 확인하세요'
    else if (st.commits) status = '최근 커밋 ' + st.commits.length + '건'
    else if (url) status = '↻ 새로고침을 눌러 커밋을 불러오세요'
    return {
      path,
      status,
      hasCommits: !!(st.commits && st.commits.length),
      commits: (st.commits || []).map((c) => ({
        title: c.title || c.message,
        author: c.author_name,
        initial: (c.author_name || '?').charAt(0),
        when: timeAgo(c.created_at),
        sha: (c.short_id || '').slice(0, 8),
      })),
      refresh: () => {
        if (!url) {
          setSettingsToggled(true)
          notify('먼저 GitLab 주소를 연결해 주세요')
          return
        }
        fetchCommits(url, token, path)
      },
      openExt: () => {
        if (!url) {
          setSettingsToggled(true)
          notify('먼저 GitLab 주소를 연결해 주세요')
          return
        }
        window.open(url.replace(/\/+$/, '') + '/' + path + '/-/commits', '_blank')
      },
      remove: () => removeProj(path),
    }
  })

  return (
    <section data-screen-label="GitLab 커밋 이력">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#FDEAE2,#FAD6C6)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🦊</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>GitLab 커밋 이력</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>프로젝트별 최근 커밋을 한눈에 확인해요</p>
        </div>
        <HoverButton
          onClick={() => setSettingsToggled((v) => !v)}
          style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#fff', border: '1px solid #EAEDF5', padding: '9px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all .15s' }}
          hoverStyle={{ color: '#E2542C', border: '1px solid #F5C8B8' }}
        >
          ⚙️ 연결 설정
        </HoverButton>
      </div>

      {/* 연결 설정 */}
      {settingsOpen && (
        <div style={{ background: '#fff', border: '2px solid #F0A188', borderRadius: '20px', padding: '20px', marginBottom: '18px', boxShadow: '0 8px 24px rgba(226,84,44,.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800 }}>사내 GitLab 연결</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="GitLab 주소 (예: http://gitlab.ctr.co.kr)" style={{ flex: 2, minWidth: '220px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Access Token (read_api 권한)" style={{ flex: 1, minWidth: '180px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
            <button onClick={saveGitlab} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#F0754C,#E2542C)', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(226,84,44,.3)' }}>연결</button>
          </div>
          <div style={{ fontSize: '12.5px', color: '#98A0B3', lineHeight: 1.7 }}>💡 토큰은 GitLab → 프로필 → Access Tokens에서 <b>read_api</b> 권한으로 발급받아요. 토큰은 이 브라우저에만 저장돼요.<br />브라우저에서 직접 연결이 안 되면(CORS 차단) 프로젝트 링크로 새 탭에서 열 수 있어요.</div>
        </div>
      )}

      {/* 프로젝트 추가 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input value={newProj} onChange={(e) => setNewProj(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProj()} placeholder="프로젝트 경로 추가 (예: dev-team/mes-backend)" style={{ flex: 1, minWidth: '220px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
        <HoverButton
          onClick={addProj}
          style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#F0754C,#E2542C)', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(226,84,44,.3)', transition: 'transform .15s ease' }}
          hoverStyle={{ transform: 'translateY(-2px)' }}
        >
          ＋ 추가
        </HoverButton>
      </div>

      {/* 프로젝트 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
        {projectViews.map((p) => (
          <div key={p.path} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '18px 20px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#FDEAE2', color: '#E2542C', display: 'grid', placeItems: 'center', fontSize: '17px', flexShrink: 0 }}>📁</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.01em' }}>{p.path}</div>
                <div style={{ fontSize: '12.5px', color: '#98A0B3' }}>{p.status}</div>
              </div>
              <HoverButton onClick={p.refresh} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#E2542C', background: '#FDEAE2', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>↻ 새로고침</HoverButton>
              <HoverButton onClick={p.openExt} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E2542C' }}>커밋 페이지 ↗</HoverButton>
              <HoverButton onClick={p.remove} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
            </div>
            {p.hasCommits && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #F1F3F7', paddingTop: '12px' }}>
                {p.commits.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F3F7', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 800, color: '#737E92', flexShrink: 0 }}>{c.initial}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#232B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      <div style={{ fontSize: '12px', color: '#98A0B3' }}>{c.author} · {c.when} · <span style={{ fontFamily: 'monospace', color: '#B0B7C7' }}>{c.sha}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>추적할 프로젝트를 위에서 추가해 주세요 (예: dev-team/mes-backend)</div>
        )}
      </div>
    </section>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton, HoverDiv } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const ACCENT = '#1E9BAE'
const ACCENT_BG = '#E3F5F8'

const DEFAULT_LINKS = [
  { id: 's1', name: 'MES', url: '' },
  { id: 's2', name: 'ERP', url: '' },
  { id: 's3', name: '그룹웨어', url: '' },
]
const DEFAULT_DBS = [
  { id: 'db1', name: 'MES 운영 DB', host: '10.20.30.11', port: '1521', database: 'MESPRD', note: 'Oracle · 읽기전용 계정은 인프라팀 문의' },
  { id: 'db2', name: '포털 개발 DB', host: '10.20.30.52', port: '3306', database: 'portal_dev', note: 'MySQL 8 · dev / dev1234' },
]

const TABS = [
  { key: 'url', name: '🔗 시스템 URL' },
  { key: 'db', name: '🗄️ DB 정보' },
  { key: 'tool', name: '🧰 개발 도구' },
]

export default function Resources() {
  const navigate = useNavigate()
  const notify = useToast()
  const [tab, setTab] = useState('url')

  const copy = (text, msg) => {
    try {
      navigator.clipboard.writeText(text)
      notify(msg || '복사했어요')
    } catch {
      notify('복사에 실패했어요', 'error')
    }
  }

  return (
    <section data-screen-label="자료실">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E3F5F8,#CDEBF1)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🗂️</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>자료실</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>팀에 공유할 만한 접속 정보와 개발 도구 모음</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', margin: '0 2px 16px', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const on = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: on ? 800 : 600, color: on ? '#fff' : '#737E92', background: on ? ACCENT : '#fff', border: on ? '1px solid ' + ACCENT : '1px solid #EAEDF5', padding: '9px 18px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s ease', boxShadow: on ? '0 6px 16px rgba(30,155,174,.28)' : '0 1px 2px rgba(35,43,58,.04)' }}
            >
              {t.name}
            </button>
          )
        })}
      </div>

      {tab === 'url' && <UrlTab copy={copy} notify={notify} />}
      {tab === 'db' && <DbTab copy={copy} notify={notify} />}
      {tab === 'tool' && <ToolTab copy={copy} />}
    </section>
  )
}

// ===================== 시스템 URL =====================
function UrlTab({ notify }) {
  const [stored, setLinks] = useLocalStorage('sd1-portal-syslinks', DEFAULT_LINKS)
  const links = Array.isArray(stored) ? stored : DEFAULT_LINKS
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const add = () => {
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
    <>
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="시스템 이름 (예: MES)" style={{ flex: 1, minWidth: '140px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="https:// 주소" style={{ flex: 2, minWidth: '200px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '11px 14px', color: '#232B3A' }} />
        <HoverButton onClick={add} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#33B4C6,#1E9BAE)', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,155,174,.3)', transition: 'transform .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)' }}>＋ 추가</HoverButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '13px' }}>
        {links.map((l) => {
          const urlLabel = l.url ? l.url.replace(/^https?:\/\//i, '') : 'URL 미설정 — ✕ 눌러 지우고 다시 추가하세요'
          return (
            <HoverDiv key={l.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '17px 19px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform .15s ease, box-shadow .15s ease' }} hoverStyle={{ transform: 'translateY(-3px)', boxShadow: '0 4px 12px rgba(30,155,174,.1), 0 16px 40px rgba(35,43,58,.1)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg,#E3F5F8,#CDEBF1)', color: ACCENT, display: 'grid', placeItems: 'center', fontSize: '19px', flexShrink: 0 }}>🖥️</div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.01em' }}>{l.name}</div>
                <div style={{ fontSize: '12.5px', color: '#98A0B3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urlLabel}</div>
              </div>
              <HoverButton onClick={() => open(l)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: l.url ? '#fff' : '#B0B7C7', background: l.url ? ACCENT : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '8px 16px', cursor: 'pointer', flexShrink: 0, transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>열기 ↗</HoverButton>
              <HoverButton onClick={() => remove(l.id)} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
            </HoverDiv>
          )
        })}
      </div>
      {links.length === 0 && (
        <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>등록된 시스템이 없어요. 위에서 추가해 보세요!</div>
      )}
    </>
  )
}

// ===================== DB 정보 =====================
const emptyDb = { name: '', host: '', port: '', database: '', note: '' }
function DbTab({ copy }) {
  const [stored, setDbs] = useLocalStorage('sd1-portal-dbinfo', DEFAULT_DBS)
  const dbs = Array.isArray(stored) ? stored : DEFAULT_DBS
  const [form, setForm] = useState(emptyDb)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const add = () => {
    if (!form.name.trim()) return
    setDbs([...dbs, { id: 'db' + Date.now(), ...form, name: form.name.trim() }])
    setForm(emptyDb)
  }
  const remove = (id) => setDbs(dbs.filter((q) => q.id !== id))
  const summary = (d) => `${d.name} — ${d.host}:${d.port}/${d.database}${d.note ? ' (' + d.note + ')' : ''}`

  const inp = (k, ph, flex) => (
    <input value={form[k]} onChange={(e) => set(k, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={ph} style={{ flex, minWidth: k === 'note' ? '160px' : '90px', border: '1.5px solid #E7EAF3', borderRadius: '11px', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px', padding: '10px 13px', color: '#232B3A' }} />
  )

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', gap: '9px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {inp('name', '이름 (예: MES 운영 DB)', 2)}
        {inp('host', '호스트', 2)}
        {inp('port', '포트', 1)}
        {inp('database', 'DB명', 1)}
        {inp('note', '메모 (종류·계정 등)', 2)}
        <HoverButton onClick={add} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#33B4C6,#1E9BAE)', border: 'none', borderRadius: '11px', padding: '10px 22px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,155,174,.3)', transition: 'transform .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)' }}>＋ 추가</HoverButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '13px' }}>
        {dbs.map((d) => (
          <div key={d.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#E3F5F8', color: ACCENT, display: 'grid', placeItems: 'center', fontSize: '17px', flexShrink: 0 }}>🗄️</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '-.01em' }}>{d.name}</div>
              <HoverButton onClick={() => copy(summary(d), 'DB 접속정보를 복사했어요')} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: ACCENT, background: ACCENT_BG, border: 'none', padding: '6px 13px', borderRadius: '999px', cursor: 'pointer', flexShrink: 0, transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>📋 복사</HoverButton>
              <HoverButton onClick={() => remove(d.id)} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0, transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '13px', paddingLeft: '48px' }}>
              <span style={{ color: '#98A0B3' }}>호스트 <b style={{ color: '#232B3A', fontFamily: 'monospace' }}>{d.host || '-'}</b></span>
              <span style={{ color: '#98A0B3' }}>포트 <b style={{ color: '#232B3A', fontFamily: 'monospace' }}>{d.port || '-'}</b></span>
              <span style={{ color: '#98A0B3' }}>DB <b style={{ color: '#232B3A', fontFamily: 'monospace' }}>{d.database || '-'}</b></span>
            </div>
            {d.note && <div style={{ fontSize: '12.5px', color: '#8B94A8', paddingLeft: '48px' }}>{d.note}</div>}
          </div>
        ))}
      </div>
      {dbs.length === 0 && (
        <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>등록된 DB 정보가 없어요. 위에서 추가해 보세요!</div>
      )}
    </>
  )
}

// ===================== 개발 도구 =====================
function ToolTab({ copy }) {
  const [charText, setCharText] = useState('')
  const [caseText, setCaseText] = useState('')
  const [jsonText, setJsonText] = useState('')

  const stats = {
    withSpace: charText.length,
    noSpace: charText.replace(/\s/g, '').length,
    words: charText.trim() ? charText.trim().split(/\s+/).length : 0,
    lines: charText ? charText.split('\n').length : 0,
    bytes: new Blob([charText]).size,
  }

  let jsonOut = ''
  let jsonErr = null
  if (jsonText.trim()) {
    try {
      jsonOut = JSON.stringify(JSON.parse(jsonText), null, 2)
    } catch (e) {
      jsonErr = e.message
    }
  }

  const toolCard = { background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '18px 20px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }
  const ta = { fontFamily: "'Noto Sans KR',monospace", fontSize: '13.5px', lineHeight: 1.7, border: '1.5px solid #E7EAF3', borderRadius: '13px', padding: '12px 15px', outline: 'none', resize: 'vertical', color: '#232B3A', width: '100%', boxSizing: 'border-box' }
  const title = { fontSize: '14.5px', fontWeight: 800 }
  const copyBtnStyle = { fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: ACCENT, background: ACCENT_BG, border: 'none', borderRadius: '999px', padding: '7px 15px', cursor: 'pointer', transition: 'transform .15s' }

  return (
    <>
      {/* 글자수 세기 */}
      <div style={toolCard}>
        <div style={title}>🔢 글자수 세기</div>
        <textarea value={charText} onChange={(e) => setCharText(e.target.value)} rows={4} placeholder="텍스트를 붙여넣으면 실시간으로 세어드려요" spellCheck={false} style={ta} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            ['공백 포함', stats.withSpace + '자'],
            ['공백 제외', stats.noSpace + '자'],
            ['단어', stats.words + '개'],
            ['줄', stats.lines + '줄'],
            ['바이트(UTF-8)', stats.bytes + 'B'],
          ].map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#F5FBFC', border: '1px solid #DDF0F3', borderRadius: '10px', padding: '7px 12px' }}>
              <span style={{ color: '#98A0B3' }}>{k}</span>
              <b style={{ color: ACCENT }}>{v}</b>
            </span>
          ))}
        </div>
      </div>

      {/* 대문자/소문자 변환 */}
      <div style={toolCard}>
        <div style={title}>🔠 대소문자 변환</div>
        <textarea value={caseText} onChange={(e) => setCaseText(e.target.value)} rows={3} placeholder="변환할 텍스트를 입력하세요" spellCheck={false} style={ta} />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>대문자</span>
              <HoverButton onClick={() => copy(caseText.toUpperCase(), '대문자로 복사했어요')} style={copyBtnStyle} hoverStyle={{ transform: 'scale(1.04)' }}>📋 복사</HoverButton>
            </div>
            <div style={{ ...ta, background: '#F8FBFC', minHeight: '40px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{caseText.toUpperCase()}</div>
          </div>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>소문자</span>
              <HoverButton onClick={() => copy(caseText.toLowerCase(), '소문자로 복사했어요')} style={copyBtnStyle} hoverStyle={{ transform: 'scale(1.04)' }}>📋 복사</HoverButton>
            </div>
            <div style={{ ...ta, background: '#F8FBFC', minHeight: '40px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{caseText.toLowerCase()}</div>
          </div>
        </div>
      </div>

      {/* JSON 포맷 */}
      <div style={toolCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={title}>{ '{ } ' }JSON 정렬</div>
          <div style={{ flex: 1 }} />
          <HoverButton onClick={() => jsonOut && copy(jsonOut, '정렬된 JSON을 복사했어요')} style={copyBtnStyle} hoverStyle={{ transform: 'scale(1.04)' }}>📋 결과 복사</HoverButton>
        </div>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={4} placeholder='{"key":"value","arr":[1,2,3]} 형태로 붙여넣으면 보기 좋게 정렬해요' spellCheck={false} style={ta} />
        {jsonErr ? (
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#E05B5B', background: '#FFECEC', borderRadius: '10px', padding: '10px 14px' }}>⚠️ 올바른 JSON이 아니에요 — {jsonErr}</div>
        ) : (
          jsonOut && <pre style={{ ...ta, background: '#F8FBFC', margin: 0, overflow: 'auto', maxHeight: '320px' }}>{jsonOut}</pre>
        )}
      </div>
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'

// 엑셀(.xlsx·.csv) 업로드 → 시트별 표로 표시. 파일은 브라우저 localStorage에 저장.
export default function Maintenance() {
  const navigate = useNavigate()
  const [storedFiles, setFiles] = useLocalStorage('sd1-portal-maint', [])
  const files = Array.isArray(storedFiles) ? storedFiles : []
  const [active, setActive] = useState(0)
  const [sheetSel, setSheetSel] = useState(0)
  const [error, setError] = useState(null)

  const activeIdx = Math.min(active, Math.max(0, files.length - 1))
  const file = files[activeIdx] || null
  const sheetIdx = file ? Math.min(sheetSel, file.sheets.length - 1) : 0
  const sheet = file ? file.sheets[sheetIdx] : null

  const onMaintFile = (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setError(null)
    list.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' })
          const sheets = wb.SheetNames.map((name) => {
            let rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
            rows = rows.slice(0, 500).map((r) => r.slice(0, 40).map((v) => String(v)))
            return { name, rows }
          }).filter((s) => s.rows.length)
          const entry = { name: f.name, ts: Date.now(), sheets: sheets.length ? sheets : [{ name: 'Sheet1', rows: [['(빈 파일)']] }] }
          setFiles((cur) => [...cur.filter((q) => q.name !== f.name), entry])
          setActive(Number.MAX_SAFE_INTEGER) // 방금 추가한(마지막) 파일 선택 — 렌더 시 clamp됨
          setSheetSel(0)
        } catch (err) {
          setError(f.name + ' — 파일을 읽지 못했어요: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(f)
    })
    e.target.value = ''
  }

  const removeFile = (i) => {
    setFiles(files.filter((_, j) => j !== i))
    setActive(0)
    setSheetSel(0)
  }

  const head = sheet ? sheet.rows[0] || [] : []
  const body = sheet ? sheet.rows.slice(1) : []
  const maintMeta = sheet ? file.name + ' · ' + sheet.name + ' · ' + Math.max(0, sheet.rows.length - 1) + '행 (최대 500행 표시)' : ''

  return (
    <section data-screen-label="유지보수 내역">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E2F2E9,#CBE7D8)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>📊</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>유지보수 내역</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>엑셀 파일(.xlsx·.csv)을 올리면 표로 바로 볼 수 있어요</p>
        </div>
        <HoverLabel>
          📂 엑셀 파일 올리기
          <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={onMaintFile} style={{ display: 'none' }} />
        </HoverLabel>
      </div>

      {error && (
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E05B5B', background: '#FFECEC', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>{error}</div>
      )}

      {files.length > 0 ? (
        <>
          {/* 파일 탭 */}
          <div style={{ display: 'flex', gap: '8px', margin: '0 4px 14px', flexWrap: 'wrap', alignItems: 'center' }}>
            {files.map((f, i) => {
              const on = i === activeIdx
              return (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: on ? '#E2F2E9' : '#fff', border: on ? '1px solid #9CCDB2' : '1px solid #EAEDF5', borderRadius: '999px', padding: '7px 8px 7px 16px' }}>
                  <button onClick={() => { setActive(i); setSheetSel(0) }} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: on ? 800 : 600, color: on ? '#217346' : '#737E92', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>📄 {f.name}</button>
                  <HoverButton onClick={() => removeFile(i)} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
                </div>
              )
            })}
          </div>

          {/* 시트 탭 */}
          {file && file.sheets.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', margin: '0 4px 14px', flexWrap: 'wrap' }}>
              {file.sheets.map((s, i) => {
                const on = i === sheetIdx
                return (
                  <button key={s.name + i} onClick={() => setSheetSel(i)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: on ? 800 : 600, color: on ? '#fff' : '#737E92', background: on ? '#217346' : '#F1F3F7', border: 'none', borderRadius: '9px', padding: '7px 15px', cursor: 'pointer', transition: 'all .15s' }}>{s.name}</button>
                )
              })}
            </div>
          )}

          {/* 표 */}
          <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', boxShadow: cardShadow, overflow: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
            {sheet && (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontFamily: "'Noto Sans KR',sans-serif" }}>
                <thead>
                  <tr>
                    {head.map((h, i) => (
                      <th key={i} style={{ position: 'sticky', top: 0, background: '#217346', color: '#fff', fontWeight: 800, fontSize: '12.5px', padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', zIndex: 2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((r, ri) => (
                    <tr key={ri} style={{ background: ri % 2 ? '#F6FAF7' : '#fff' }}>
                      {r.map((c, ci) => (
                        <td key={ci} style={{ padding: '7px 12px', borderBottom: '1px solid #EEF2EE', color: '#3A4354', whiteSpace: 'nowrap', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ margin: '10px 4px 0', fontSize: '12px', color: '#98A0B3' }}>{maintMeta}</div>
        </>
      ) : (
        <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '56px 40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600, lineHeight: 1.8 }}>
          아직 올린 파일이 없어요.<br />
          오른쪽 위 <b style={{ color: '#217346' }}>📂 엑셀 파일 올리기</b>로 유지보수 내역 파일을 올려보세요.<br />
          <span style={{ fontSize: '12.5px', fontWeight: 500 }}>올린 파일은 이 브라우저에 저장되어 다시 접속해도 유지돼요.</span>
        </div>
      )}
    </section>
  )
}

// 원본의 style-hover 가 걸린 업로드 label (버튼 대신 label로 파일 input 감쌈)
function HoverLabel({ children }) {
  const [hover, setHover] = useState(false)
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#2E8B57,#217346)', padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(33,115,70,.3)', transition: 'transform .15s ease', ...(hover ? { transform: 'translateY(-2px)' } : null) }}
    >
      {children}
    </label>
  )
}

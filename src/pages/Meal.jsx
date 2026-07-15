import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton, HoverDiv } from '../components/ui'
import mealData from '../data/meal.json'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
// 식단 데이터는 src/data/meal.json 에서 옵니다.
// 이 파일은 매주 월요일 원본 PPTX(주간 식단표)를 읽어 자동으로 갱신됩니다.
const MEAL_SOURCE_URL = mealData.sourceUrl
const WEEK_RANGE_LABEL = mealData.weekRangeLabel
const ACCENTS = ['#E8823A', '#4C6FFF', '#2FA36B', '#7C5CFC', '#E05B8B']
export const CAFETERIAS = mealData.cafeterias

function foodEmoji(main) {
  const rules = [
    [/오리/, '🦆'], [/닭|치킨/, '🍗'], [/제육|불고기|두루치기|고기/, '🥩'],
    [/까스|카츠|탕수육/, '🍖'], [/생선|고등어|갈치|어묵/, '🐟'], [/오징어|해물|낙지/, '🦑'],
    [/국수|우동|면|라면/, '🍜'], [/찌개|탕|국밥/, '🍲'], [/카레/, '🍛'],
    [/솥밥|볶음밥|덮밥|비빔밥|밥/, '🍚'], [/두부/, '🧈'], [/샐러드/, '🥗'],
  ]
  for (const [re, e] of rules) if (re.test(main)) return e
  return '🍽️'
}

export default function Meal() {
  const navigate = useNavigate()
  const notify = useToast()
  const [cafIdx, setCafIdx] = useState(0)
  const [customWeek, setCustomWeek] = useLocalStorage('sd1-portal-menu-' + cafIdx, null)
  const [mealMode, setMealMode] = useState('menu') // 'menu' | 'doc'
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editError, setEditError] = useState(null)

  const caf = CAFETERIAS[cafIdx]
  const WEEK = Array.isArray(customWeek) && customWeek.length === 5 ? customWeek : caf.week

  const d = new Date()
  let todayIdx = d.getDay() - 1
  if (todayIdx < 0 || todayIdx > 4) todayIdx = 0

  const week = WEEK.map((w, i) => {
    const special = /특식/.test(w.main)
    return {
      ...w,
      isToday: i === todayIdx,
      isPast: i < todayIdx,
      opacity: i < todayIdx ? 0.55 : 1,
      special,
      mainClean: w.main.replace(/\s*\(?특식\)?/g, '').trim(),
      emoji: foodEmoji(w.main),
      accent: ACCENTS[i],
      sides: w.side.split('·').map((s) => s.trim()).filter(Boolean),
    }
  })
  const todayMeal = week[todayIdx]
  const otherDays = week.filter((_, i) => i !== todayIdx)

  const startEdit = () => {
    setEditText(WEEK.map((w) => w.dow + ': ' + w.main + ' / ' + w.side).join('\n'))
    setEditError(null)
    setMealMode('menu')
    setEditing(true)
  }
  const saveEdit = () => {
    const DOWS = ['월', '화', '수', '목', '금']
    const defaults = caf.week
    const byDow = {}
    editText.split('\n').forEach((line) => {
      const m = line.trim().match(/^([월화수목금])\s*[:：.]?\s*(.+)$/)
      if (!m) return
      const parts = m[2].split('/')
      byDow[m[1]] = { main: parts[0].trim(), side: parts.slice(1).join('/').trim() || '' }
    })
    const missing = DOWS.filter((dow) => !byDow[dow] || !byDow[dow].main)
    if (missing.length === 5) {
      setEditError('요일을 인식하지 못했어요. "월: 메뉴 / 반찬" 형식으로 한 줄씩 적어주세요.')
      return
    }
    const week2 = DOWS.map((dow, i) => ({
      dow,
      date: defaults[i].date,
      main: byDow[dow] ? byDow[dow].main : defaults[i].main,
      side: byDow[dow] ? byDow[dow].side : defaults[i].side,
    }))
    setCustomWeek(week2)
    setEditing(false)
    setEditError(null)
    notify(caf.name + ' 식단 저장 완료')
  }
  const resetMenu = () => {
    setCustomWeek(null)
    setEditing(false)
    setEditError(null)
    notify('기본 예시로 되돌렸어요')
  }
  const toggleMealMode = () => {
    setMealMode((m) => (m === 'menu' ? 'doc' : 'menu'))
    setEditing(false)
  }

  const isMenuMode = mealMode === 'menu'
  const isDocMode = mealMode === 'doc'

  return (
    <section data-screen-label="식단표" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 140px)' }}>
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#FFF1E6,#FFE3CB)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🍚</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>이번 주 식단표</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>{WEEK_RANGE_LABEL} · {caf.desc}</p>
        </div>
        <HoverAnchor
          href={MEAL_SOURCE_URL}
          target="_blank"
          rel="noopener"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: '#E8823A', background: '#FFF1E6', border: '1px solid #FFDDC2', padding: '9px 16px', borderRadius: '12px', textDecoration: 'none', transition: 'transform .15s ease, box-shadow .15s ease' }}
          hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(232,130,58,.2)' }}
        >
          원본 식단표 열기 ↗
        </HoverAnchor>
      </div>

      {/* 식당 탭 + 도구 */}
      <div style={{ display: 'flex', gap: '8px', margin: '0 4px 18px', alignItems: 'center', flexWrap: 'wrap' }}>
        {CAFETERIAS.map((c, i) => {
          const on = i === cafIdx
          return (
            <button
              key={c.name}
              onClick={() => setCafIdx(i)}
              style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: on ? 800 : 600, color: on ? '#fff' : '#737E92', background: on ? '#E8823A' : '#fff', border: on ? '1px solid #E8823A' : '1px solid #EAEDF5', padding: '9px 18px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s ease', boxShadow: on ? '0 6px 16px rgba(232,130,58,.3)' : '0 1px 2px rgba(35,43,58,.04)' }}
            >
              {c.name}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <HoverButton onClick={toggleMealMode} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#fff', border: '1px solid #EAEDF5', padding: '8px 15px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#4C6FFF', border: '1px solid #CCDAFF' }}>
          {isMenuMode ? '📎 원본 문서로 보기' : '📋 메뉴 목록으로 보기'}
        </HoverButton>
        <HoverButton onClick={startEdit} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#fff', border: '1px solid #EAEDF5', padding: '8px 15px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E8823A', border: '1px solid #FFDDC2' }}>
          ✎ 식단 편집
        </HoverButton>
      </div>

      {/* 붙여넣기 편집 패널 */}
      {editing && (
        <div style={{ background: '#fff', border: '2px solid #F0A468', borderRadius: '20px', padding: '22px', marginBottom: '18px', boxShadow: '0 8px 24px rgba(232,130,58,.12)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>{caf.name} 식단 붙여넣기</div>
            <div style={{ fontSize: '12.5px', color: '#98A0B3' }}>한 줄에 한 요일 · 형식: <b style={{ color: '#737E92' }}>월: 메인메뉴 / 반찬 · 반찬 · 반찬</b></div>
          </div>
          <textarea
            value={editText}
            onChange={(e) => { setEditText(e.target.value); setEditError(null) }}
            rows={7}
            spellCheck={false}
            style={{ fontFamily: "'Noto Sans KR',monospace", fontSize: '14px', lineHeight: 1.9, border: '1.5px solid #E7EAF3', borderRadius: '13px', padding: '14px 16px', outline: 'none', resize: 'vertical', color: '#232B3A', width: '100%', boxSizing: 'border-box' }}
          />
          {editError && (
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#E05B5B', background: '#FFECEC', borderRadius: '10px', padding: '10px 14px' }}>{editError}</div>
          )}
          <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
            <button onClick={saveEdit} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: '#E8823A', border: 'none', borderRadius: '11px', padding: '10px 22px', cursor: 'pointer', boxShadow: '0 6px 16px rgba(232,130,58,.3)' }}>저장</button>
            <button onClick={() => { setEditing(false); setEditError(null) }} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', borderRadius: '11px', padding: '10px 18px', cursor: 'pointer' }}>취소</button>
            <div style={{ flex: 1 }} />
            <button onClick={resetMenu} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>기본 예시로 되돌리기</button>
          </div>
        </div>
      )}

      {/* 원본 문서 안내 */}
      {isDocMode && (
        <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '44px 28px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
          <div style={{ width: '58px', height: '58px', borderRadius: '18px', background: 'linear-gradient(135deg,#E8F0FF,#D7E4FF)', display: 'grid', placeItems: 'center', fontSize: '27px' }}>🔒</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '440px' }}>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.01em' }}>원본 식단표는 새 탭에서 열려요</div>
            <div style={{ fontSize: '13.5px', color: '#8B94A8', lineHeight: 1.7 }}>회사 SharePoint 보안 정책이 다른 사이트 안에 문서를 표시하는 것을 차단하고 있어요. 아래 버튼으로 바로 열 수 있어요.</div>
          </div>
          <HoverAnchor
            href={MEAL_SOURCE_URL}
            target="_blank"
            rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#5C7CFF,#4C6FFF)', padding: '13px 26px', borderRadius: '13px', textDecoration: 'none', boxShadow: '0 10px 24px rgba(76,111,255,.32)', transition: 'transform .15s ease, box-shadow .15s ease' }}
            hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 14px 32px rgba(76,111,255,.42)' }}
          >
            CTR빌딩 주간식단표 열기 ↗
          </HoverAnchor>
          <div style={{ fontSize: '12.5px', color: '#B0B7C7' }}>열람하려면 브라우저에 회사 계정(Microsoft 365) 로그인이 필요해요.</div>
        </div>
      )}

      {isMenuMode && (
        <>
          {/* 오늘의 메뉴 히어로 */}
          <div style={{ borderRadius: '24px', background: 'linear-gradient(115deg,#FFE7CF 0%,#FFF0DE 55%,#FFE2C2 100%)', border: '1px solid #FFDDBB', padding: '26px 28px', marginBottom: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 28px rgba(232,130,58,.14)' }}>
            <div style={{ position: 'absolute', right: '-24px', bottom: '-38px', fontSize: '150px', opacity: 0.14, transform: 'rotate(-12deg)', pointerEvents: 'none' }}>{todayMeal.emoji}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', flexWrap: 'wrap' }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '22px', background: 'rgba(255,255,255,.75)', display: 'grid', placeItems: 'center', fontSize: '40px', boxShadow: '0 6px 16px rgba(232,130,58,.18), inset 0 1px 0 rgba(255,255,255,.9)', flexShrink: 0 }}>{todayMeal.emoji}</div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff', background: '#E8823A', padding: '3px 11px', borderRadius: '999px', boxShadow: '0 3px 8px rgba(232,130,58,.35)' }}>오늘 · {todayMeal.dow}요일 {todayMeal.date}</span>
                  {todayMeal.special && (
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#B4437A', background: '#FFE3F0', padding: '3px 11px', borderRadius: '999px' }}>✦ 특식</span>
                  )}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-.02em', color: '#5A3A1E' }}>{todayMeal.mainClean}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {todayMeal.sides.map((s, i) => (
                    <span key={i} style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-.02em', color: '#5A3A1E', background: 'rgba(255,255,255,.72)', padding: '5px 16px', borderRadius: '999px', boxShadow: 'inset 0 0 0 1px rgba(232,130,58,.14)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 나머지 요일 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gridAutoRows: '1fr', gap: '13px', flex: 1 }}>
            {otherDays.map((day) => (
              <HoverDiv
                key={day.dow}
                style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '18px 19px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '11px', opacity: day.opacity, transition: 'transform .18s ease, box-shadow .18s ease' }}
                hoverStyle={{ transform: 'translateY(-3px)', boxShadow: '0 4px 12px rgba(232,130,58,.08), 0 16px 40px rgba(35,43,58,.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: day.accent }}>{day.dow}</span>
                    <span style={{ fontSize: '12px', color: '#98A0B3', fontWeight: 600 }}>{day.date}</span>
                  </div>
                  <span style={{ fontSize: '22px' }}>{day.emoji}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.6, color: '#232B3A' }}>{day.mainClean}</span>
                    {day.special && (
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#B4437A', background: '#FFE3F0', padding: '2px 8px', borderRadius: '999px', flexShrink: 0 }}>특식</span>
                    )}
                  </div>
                  {day.sides.map((s, i) => (
                    <div key={i} style={{ fontSize: '15.5px', fontWeight: 600, lineHeight: 1.6, color: '#4A5468' }}>{s}</div>
                  ))}
                </div>
                {day.isPast && (
                  <span style={{ alignSelf: 'flex-start', fontSize: '11px', fontWeight: 700, color: '#B0B7C7', background: '#F1F3F7', padding: '2px 9px', borderRadius: '999px', marginTop: 'auto' }}>지난 메뉴</span>
                )}
              </HoverDiv>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// 원본 style-hover 를 가진 <a> 링크 (ui.jsx의 HoverDiv/HoverButton은 div/button 전용)
function HoverAnchor({ style, hoverStyle, ...rest }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      {...rest}
      style={{ ...style, ...(hover && hoverStyle ? hoverStyle : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    />
  )
}

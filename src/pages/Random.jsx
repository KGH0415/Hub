import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const PALETTE = ['#FFCBA0', '#AECBFF', '#A9E8CC', '#D7C8FF', '#FFC0D8', '#FFE3A3', '#B6E4F0', '#F3B8B8']
const TEAM = ['가현', '권택수', '민수', '지영', '현우']

const polar = (deg, r, cx = 150, cy = 150) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}
const mulberry = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// 룰렛·사다리·의사결정 3종 결정 도우미
export default function Random() {
  const navigate = useNavigate()
  const { userName } = useAuth()
  const notify = useToast()
  const myName = userName

  const [gameTab, setGameTab] = useState('wheel')

  // ----- 원판 -----
  const [wheelItems, setWheelItems] = useState(['', '', '', '', '', ''])
  const [wheelCount, setWheelCount] = useState(6)
  const [wheelAngle, setWheelAngle] = useState(0)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState(null)
  const [wheelBurst, setWheelBurst] = useState(false)
  const [wheelPage, setWheelPage] = useState(0)
  const spinT = useRef(null)

  // ----- 사다리 -----
  const [ladderNames, setLadderNames] = useState(['', '', '', ''])
  const [ladderResults, setLadderResults] = useState(['', '', '', ''])
  const [ladderCount, setLadderCount] = useState(4)
  const [ladderSeed, setLadderSeed] = useState(7)
  const [ladderPicked, setLadderPicked] = useState(null)
  const [ladderRevealed, setLadderRevealed] = useState(false)
  const [ladderBurst, setLadderBurst] = useState(false)
  const [ladderInputPage, setLadderInputPage] = useState(0)
  const ladderT = useRef(null)

  // ----- 의사결정 -----
  const [polls, setPolls] = useLocalStorage('sd1-portal-decides', [])
  const [topicInput, setTopicInput] = useState('')
  const [optInputs, setOptInputs] = useState({})
  const [linkInputs, setLinkInputs] = useState({})

  useEffect(() => () => { clearTimeout(spinT.current); clearTimeout(ladderT.current) }, [])

  const resetBursts = () => { setWheelBurst(false); setLadderBurst(false) }

  // ===================== 원판 계산 =====================
  const items = wheelItems.slice(0, wheelCount)
  while (items.length < wheelCount) items.push('')
  const wheelOpts = items.map((t) => t.trim()).filter(Boolean)
  const n = Math.max(wheelOpts.length, 1)
  const segAngle = 360 / n
  const R = 148
  const wheelSegments = wheelOpts.map((name, i) => {
    const a0 = i * segAngle
    const a1 = (i + 1) * segAngle
    const mid = (a0 + a1) / 2
    const [x1, y1] = polar(a0, R)
    const [x2, y2] = polar(a1, R)
    const large = segAngle > 180 ? 1 : 0
    const d = n === 1
      ? 'M150,2 A148,148 0 1 1 149.9,2 Z'
      : 'M150,150 L' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' Z'
    const [lx, ly] = polar(mid, 100)
    return {
      name: name.length > 8 ? name.slice(0, 8) + '…' : name,
      fill: PALETTE[i % PALETTE.length],
      d,
      labelX: lx.toFixed(1),
      labelY: ly.toFixed(1),
      labelTransform: 'rotate(' + mid.toFixed(1) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')',
    }
  })
  const wheelTotalPages = Math.max(1, Math.ceil(items.length / 8))
  const wheelPg = Math.min(wheelPage, wheelTotalPages - 1)
  const wheelInputSlice = items.map((value, i) => ({ value, i })).slice(wheelPg * 8, wheelPg * 8 + 8)
  const wheelLow = wheelOpts.length < 2

  const setWheelItem = (i, v) => {
    const next = items.slice()
    next[i] = v
    setWheelItems(next)
    setWheelResult(null)
  }
  const removeWheelItem = (i) => {
    if (wheelCount <= 2) { notify('항목은 최소 2개가 필요해요'); return }
    const next = items.slice()
    next.splice(i, 1)
    setWheelItems(next)
    setWheelCount(wheelCount - 1)
    setWheelResult(null)
  }
  const spinWheel = () => {
    if (wheelSpinning || wheelOpts.length < 2) return
    const winner = Math.floor(Math.random() * wheelOpts.length)
    const targetMid = winner * segAngle + segAngle / 2
    const jitter = (Math.random() - 0.5) * segAngle * 0.6
    const current = wheelAngle % 360
    const target = wheelAngle - current + 360 * 5 + (360 - targetMid + jitter)
    setWheelSpinning(true)
    setWheelResult(null)
    setWheelAngle(target)
    clearTimeout(spinT.current)
    spinT.current = setTimeout(() => {
      setWheelSpinning(false)
      setWheelResult(wheelOpts[winner] + ' 당첨!')
      setWheelBurst(true)
    }, 4100)
  }

  // ===================== 사다리 계산 =====================
  const nameItems = ladderNames.slice(0, ladderCount)
  while (nameItems.length < ladderCount) nameItems.push('')
  const resultItems = ladderResults.slice(0, ladderCount)
  while (resultItems.length < ladderCount) resultItems.push('')
  const names = nameItems.map((t) => t.trim()).filter(Boolean)
  const ln = names.length
  const results = names.map((_, i) => resultItems[i].trim() || '꽝')
  const COLW = 84
  const TOP = 10
  const BOT = 330
  const ROWS = 9
  const colX = (i) => i * COLW + COLW / 2
  const rowY = (r) => TOP + 24 + r * ((BOT - TOP - 48) / (ROWS - 1))
  const rng = mulberry(ladderSeed * 1000 + ln)
  const rungRows = []
  for (let r = 0; r < ROWS; r++) {
    const row = []
    let prev = false
    for (let j = 0; j < ln - 1; j++) {
      const put = !prev && rng() < 0.45
      row.push(put)
      prev = put
    }
    rungRows.push(row)
  }
  const ladderRungs = []
  rungRows.forEach((row, r) => row.forEach((put, j) => {
    if (put) ladderRungs.push({ x1: colX(j), x2: colX(j + 1), y: rowY(r).toFixed(1) })
  }))
  const walk = (start) => {
    let pos = start
    const pts = [[colX(pos), TOP]]
    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r)
      if (pos < ln - 1 && rungRows[r][pos]) { pts.push([colX(pos), y], [colX(pos + 1), y]); pos++ }
      else if (pos > 0 && rungRows[r][pos - 1]) { pts.push([colX(pos), y], [colX(pos - 1), y]); pos-- }
    }
    pts.push([colX(pos), BOT])
    return { end: pos, points: pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') }
  }
  const walked = ladderPicked !== null && ladderPicked < ln ? walk(ladderPicked) : null
  const ladderTotalPages = Math.max(1, Math.ceil(ladderCount / 8))
  const ladderPg = Math.min(ladderInputPage, ladderTotalPages - 1)
  const ladderLow = ln < 2

  const setLadderName = (i, v) => {
    const next = nameItems.slice()
    next[i] = v
    setLadderNames(next)
    setLadderPicked(null)
  }
  const setLadderResult = (i, v) => {
    const next = resultItems.slice()
    next[i] = v
    setLadderResults(next)
    setLadderPicked(null)
  }
  const removeLadderRow = (i) => {
    if (ladderCount <= 2) { notify('참가자는 최소 2명이 필요해요'); return }
    const nn = nameItems.slice(); nn.splice(i, 1)
    const nr = resultItems.slice(); nr.splice(i, 1)
    setLadderNames(nn)
    setLadderResults(nr)
    setLadderCount(ladderCount - 1)
    setLadderPicked(null)
  }
  const pickLadder = (i) => {
    clearTimeout(ladderT.current)
    setLadderPicked(i)
    setLadderRevealed(false)
    ladderT.current = setTimeout(() => { setLadderRevealed(true); setLadderBurst(true) }, 1250)
  }
  const shuffleLadder = () => { setLadderSeed(Math.floor(Math.random() * 100000)); setLadderPicked(null) }

  // ===================== 의사결정 =====================
  const startDecide = () => {
    const topic = topicInput.trim()
    if (!topic) { notify('결정할 주제를 입력해 주세요'); return }
    setPolls([{ id: 'p' + Date.now(), topic, opener: myName, options: [], votes: [] }, ...polls])
    setTopicInput('')
  }
  const updatePoll = (id, patch) => setPolls(polls.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  const addOpt = (poll) => {
    const text = (optInputs[poll.id] || '').trim()
    if (!text) return
    let link = (linkInputs[poll.id] || '').trim()
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link
    updatePoll(poll.id, { options: [...poll.options, { id: 'd' + Date.now(), text, link, votes: [] }] })
    setOptInputs({ ...optInputs, [poll.id]: '' })
    setLinkInputs({ ...linkInputs, [poll.id]: '' })
  }

  const gameTabs = [
    { key: 'wheel', name: '🎡 룰렛 돌리기' },
    { key: 'ladder', name: '🪜 사다리타기' },
    { key: 'decide', name: '🗳️ 의사결정하기' },
  ]

  const numBtn = { fontFamily: 'inherit', width: '30px', height: '30px', border: 'none', borderRadius: '50%', background: '#fff', color: '#737E92', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 3px rgba(35,43,58,.1)', transition: 'all .15s' }
  const rowRemoveBtn = { fontFamily: 'inherit', width: '24px', height: '24px', border: 'none', borderRadius: '50%', background: '#F1F3F7', color: '#98A0B3', fontSize: '14px', fontWeight: 800, cursor: 'pointer', flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0, transition: 'all .15s' }
  const pagerBtn = (ink) => ({ fontFamily: 'inherit', width: '30px', height: '30px', border: '1px solid #EAEDF5', borderRadius: '10px', background: '#fff', color: ink, fontSize: '15px', fontWeight: 800, cursor: 'pointer', transition: 'all .15s' })
  const pagerHover = { border: '1px solid #FFCBDE' }

  return (
    <section data-screen-label="랜덤뽑기">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '2px 4px 12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg,#FFE3F0,#FFD0E3)', display: 'grid', placeItems: 'center', fontSize: '21px' }}>🎲</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-.02em' }}>결정 도우미</h1>
          <p style={{ margin: '2px 0 0', color: '#737E92', fontSize: '13.5px' }}>룰렛 · 사다리 · 의사결정 투표</p>
        </div>
      </div>

      {/* 게임 탭 */}
      <div style={{ display: 'flex', gap: '8px', margin: '0 4px 12px' }}>
        {gameTabs.map((t) => {
          const on = gameTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => { setGameTab(t.key); resetBursts() }}
              style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: on ? 800 : 600, color: on ? '#fff' : '#737E92', background: on ? '#E05B8B' : '#fff', border: on ? '1px solid #E05B8B' : '1px solid #EAEDF5', padding: '9px 18px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s ease', boxShadow: on ? '0 6px 16px rgba(224,91,139,.3)' : '0 1px 2px rgba(35,43,58,.04)' }}
            >
              {t.name}
            </button>
          )
        })}
      </div>

      {/* ===== 원판 돌리기 ===== */}
      {gameTab === 'wheel' && (
        <>
          <div style={{ fontSize: '13px', fontWeight: 600, color: wheelLow ? '#E05B5B' : '#737E92', background: wheelLow ? '#FFECEC' : '#F1F3F9', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
            {wheelLow ? '⚠️ 항목을 2개 이상 입력해 주세요.' : '💡 항목을 2개 이상 입력하면 룰렛이 만들어져요. 빈 칸은 자동으로 빠져요.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', alignItems: 'stretch' }}>
            {/* 항목 입력 */}
            <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '14.5px', fontWeight: 800 }}>뽑기 항목</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <HoverButton onClick={() => { setWheelItems(TEAM.slice(0, 12)); setWheelCount(Math.min(12, Math.max(2, TEAM.length))); setWheelResult(null) }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#E05B8B', background: '#FFE3F0', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ transform: 'scale(1.04)' }}>👥 우리팀 불러오기</HoverButton>
                  <HoverButton onClick={() => { setWheelItems(Array(wheelCount).fill('')); setWheelResult(null) }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E05B5B', background: '#FFECEC' }}>↺ 초기화</HoverButton>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#F1F3F7', borderRadius: '999px', padding: '3px' }}>
                    <HoverButton onClick={() => { setWheelCount(Math.max(2, wheelCount - 1)); setWheelResult(null) }} style={numBtn} hoverStyle={{ color: '#E05B8B' }}>−</HoverButton>
                    <span style={{ minWidth: '52px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#4A5468' }}>{wheelCount}개</span>
                    <HoverButton onClick={() => { setWheelCount(Math.min(12, wheelCount + 1)); setWheelResult(null) }} style={numBtn} hoverStyle={{ color: '#E05B8B' }}>＋</HoverButton>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '348px', overflow: 'hidden' }}>
                {wheelInputSlice.map(({ value, i }) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px solid #EAEDF5', borderRadius: '11px', padding: '2px 6px 2px 12px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#B0B7C7', minWidth: '16px' }}>{i + 1}</span>
                    <input value={value} onChange={(e) => setWheelItem(i, e.target.value)} placeholder={'항목 ' + (i + 1)} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '6px 4px', color: '#232B3A', background: 'transparent' }} />
                    <HoverButton onClick={() => removeWheelItem(i)} title="이 항목 삭제" style={rowRemoveBtn} hoverStyle={{ background: '#FFECEC', color: '#E05B5B' }}>−</HoverButton>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '32px' }}>
                {items.length > 8 && (
                  <>
                    <HoverButton onClick={() => setWheelPage(Math.max(0, wheelPg - 1))} style={pagerBtn(wheelPg === 0 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>‹</HoverButton>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#737E92', minWidth: '40px', textAlign: 'center' }}>{wheelPg + 1} / {wheelTotalPages}</span>
                    <HoverButton onClick={() => setWheelPage(Math.min(wheelTotalPages - 1, wheelPg + 1))} style={pagerBtn(wheelPg >= wheelTotalPages - 1 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>›</HoverButton>
                  </>
                )}
              </div>
            </div>
            {/* 원판 */}
            <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', position: 'relative' }}>
              <HoverButton onClick={spinWheel} style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 6, fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#F0729E,#E05B8B)', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(224,91,139,.32)', transition: 'transform .15s ease, box-shadow .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(224,91,139,.42)' }}>
                {wheelSpinning ? '두구두구…' : '돌리기!'}
              </HoverButton>
              <div style={{ position: 'relative', width: '100%', maxWidth: 'clamp(240px, calc(100vh - 430px), 380px)' }}>
                <div style={{ position: 'absolute', left: '50%', top: '-6px', transform: 'translateX(-50%)', zIndex: 2, width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: '22px solid #E05B8B', filter: 'drop-shadow(0 3px 4px rgba(224,91,139,.4))' }} />
                <svg viewBox="0 0 300 300" style={{ width: '100%', display: 'block' }}>
                  <g style={{ transform: 'rotate(' + wheelAngle + 'deg)', transformOrigin: '150px 150px', transition: wheelSpinning ? 'transform 4s cubic-bezier(.12,.65,.06,1)' : 'none' }}>
                    {wheelSegments.map((seg, i) => (
                      <path key={i} d={seg.d} fill={seg.fill} stroke="#fff" strokeWidth="2" />
                    ))}
                    {wheelSegments.map((seg, i) => (
                      <text key={'t' + i} x={seg.labelX} y={seg.labelY} transform={seg.labelTransform} textAnchor="middle" style={{ fontSize: '13px', fontWeight: 800, fill: '#5A4030', fontFamily: "'Noto Sans KR',sans-serif" }}>{seg.name}</text>
                    ))}
                    <circle cx="150" cy="150" r="26" fill="#fff" stroke="#F1E4D8" strokeWidth="3" />
                    <text x="150" y="157" textAnchor="middle" style={{ fontSize: '18px' }}>🎯</text>
                  </g>
                </svg>
                {wheelResult && wheelBurst && <Confetti key={'wc' + wheelAngle} count={70} big />}
              </div>
              <div style={{ height: '48px', display: 'grid', placeItems: 'center' }}>
                {wheelResult && (
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#E05B8B', background: '#FFE3F0', borderRadius: '999px', padding: '10px 26px', animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) both' }}>🎉 {wheelResult}</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== 사다리타기 ===== */}
      {gameTab === 'ladder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: ladderLow ? '#E05B5B' : '#737E92', background: ladderLow ? '#FFECEC' : '#F1F3F9', borderRadius: '10px', padding: '10px 14px' }}>
            {ladderLow ? '⚠️ 참가자를 2명 이상 입력해 주세요.' : '💡 참가자를 2명 이상 입력하면 사다리가 만들어져요. 결과칸을 비우면 "꽝"이 돼요.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', alignItems: 'stretch' }}>
            {/* 참가자 */}
            <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '14.5px', fontWeight: 800 }}>참가자</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <HoverButton onClick={() => { setLadderNames(TEAM.slice(0, 16)); setLadderCount(Math.min(16, Math.max(2, TEAM.length))); setLadderPicked(null) }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#E05B8B', background: '#FFE3F0', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ transform: 'scale(1.04)' }}>👥 우리팀 불러오기</HoverButton>
                  <HoverButton onClick={() => { setLadderNames(Array(ladderCount).fill('')); setLadderPicked(null) }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E05B5B', background: '#FFECEC' }}>↺ 초기화</HoverButton>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#F1F3F7', borderRadius: '999px', padding: '3px' }}>
                    <HoverButton onClick={() => { setLadderCount(Math.max(2, ladderCount - 1)); setLadderPicked(null) }} style={numBtn} hoverStyle={{ color: '#E05B8B' }}>−</HoverButton>
                    <span style={{ minWidth: '52px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#4A5468' }}>{ladderCount}명</span>
                    <HoverButton onClick={() => { setLadderCount(Math.min(16, ladderCount + 1)); setLadderPicked(null) }} style={numBtn} hoverStyle={{ color: '#E05B8B' }}>＋</HoverButton>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nameItems.map((value, i) => ({ value, i })).slice(ladderPg * 8, ladderPg * 8 + 8).map(({ value, i }) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px solid #EAEDF5', borderRadius: '11px', padding: '2px 6px 2px 12px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#B0B7C7', minWidth: '16px' }}>{i + 1}</span>
                    <input value={value} onChange={(e) => setLadderName(i, e.target.value)} placeholder={'참가자 ' + (i + 1)} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '6px 4px', color: '#232B3A', background: 'transparent' }} />
                    <HoverButton onClick={() => removeLadderRow(i)} title="이 참가자 삭제" style={rowRemoveBtn} hoverStyle={{ background: '#FFECEC', color: '#E05B5B' }}>−</HoverButton>
                  </div>
                ))}
              </div>
              {ladderCount > 8 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <HoverButton onClick={() => setLadderInputPage(Math.max(0, ladderPg - 1))} style={pagerBtn(ladderPg === 0 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>‹</HoverButton>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#737E92', minWidth: '40px', textAlign: 'center' }}>{ladderPg + 1} / {ladderTotalPages}</span>
                  <HoverButton onClick={() => setLadderInputPage(Math.min(ladderTotalPages - 1, ladderPg + 1))} style={pagerBtn(ladderPg >= ladderTotalPages - 1 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>›</HoverButton>
                </div>
              )}
            </div>
            {/* 결과 */}
            <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '14.5px', fontWeight: 800 }}>결과 <span style={{ fontSize: '12px', fontWeight: 600, color: '#98A0B3' }}>· 비우면 "꽝"</span></div>
                <HoverButton onClick={() => { setLadderResults(Array(ladderCount).fill('')); setLadderPicked(null) }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E05B5B', background: '#FFECEC' }}>↺ 초기화</HoverButton>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resultItems.map((value, i) => ({ value, i })).slice(ladderPg * 8, ladderPg * 8 + 8).map(({ value, i }) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px solid #EAEDF5', borderRadius: '11px', padding: '2px 6px 2px 12px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#B0B7C7', minWidth: '16px' }}>{i + 1}</span>
                    <input value={value} onChange={(e) => setLadderResult(i, e.target.value)} placeholder={'결과 ' + (i + 1) + ' (비우면 꽝)'} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '6px 4px', color: '#232B3A', background: 'transparent' }} />
                    <HoverButton onClick={() => removeLadderRow(i)} title="이 결과 삭제 (참가자도 함께 줄어요)" style={rowRemoveBtn} hoverStyle={{ background: '#FFECEC', color: '#E05B5B' }}>−</HoverButton>
                  </div>
                ))}
              </div>
              {ladderCount > 8 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <HoverButton onClick={() => setLadderInputPage(Math.max(0, ladderPg - 1))} style={pagerBtn(ladderPg === 0 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>‹</HoverButton>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#737E92', minWidth: '40px', textAlign: 'center' }}>{ladderPg + 1} / {ladderTotalPages}</span>
                  <HoverButton onClick={() => setLadderInputPage(Math.min(ladderTotalPages - 1, ladderPg + 1))} style={pagerBtn(ladderPg >= ladderTotalPages - 1 ? '#D5DAE6' : '#E05B8B')} hoverStyle={pagerHover}>›</HoverButton>
                </div>
              )}
            </div>
          </div>
          {ln >= 2 && (
            <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '24px 22px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden' }}>
              {walked && ladderRevealed && ladderBurst && <Confetti key={'lc' + ladderPicked + ladderSeed} count={80} big />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '14.5px', fontWeight: 800 }}>이름을 누르면 길이 나타나요</div>
                <HoverButton onClick={shuffleLadder} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ color: '#E05B8B', background: '#FFE3F0' }}>🔀 사다리 섞기</HoverButton>
              </div>
              <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                <div style={{ minWidth: ln * COLW + 'px', maxWidth: ln * 110 + 'px', margin: '0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + ln + ',1fr)', gap: '6px', marginBottom: '8px' }}>
                    {names.map((name, i) => (
                      <button key={i} onClick={() => pickLadder(i)} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, color: ladderPicked === i ? '#fff' : '#737E92', background: ladderPicked === i ? '#E05B8B' : '#F1F3F7', border: 'none', borderRadius: '11px', padding: '9px 6px', cursor: 'pointer', transition: 'all .15s', boxShadow: ladderPicked === i ? '0 6px 14px rgba(224,91,139,.32)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</button>
                    ))}
                  </div>
                  <svg viewBox={'0 0 ' + ln * COLW + ' 340'} style={{ width: '100%', display: 'block' }}>
                    {names.map((_, i) => (
                      <line key={'c' + i} x1={colX(i)} y1="10" x2={colX(i)} y2="330" stroke="#E1E5EF" strokeWidth="3" strokeLinecap="round" />
                    ))}
                    {ladderRungs.map((r, i) => (
                      <line key={'r' + i} x1={r.x1} y1={r.y} x2={r.x2} y2={r.y} stroke="#E1E5EF" strokeWidth="3" strokeLinecap="round" />
                    ))}
                    {walked && (
                      <polyline points={walked.points} fill="none" stroke="#E05B8B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawPath 1.2s ease-out forwards' }} />
                    )}
                  </svg>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + ln + ',1fr)', gap: '6px', marginTop: '8px' }}>
                    {results.map((name, i) => {
                      const hit = walked && ladderRevealed && walked.end === i
                      return (
                        <div key={i} style={{ fontSize: '12.5px', fontWeight: 700, color: hit ? '#E05B8B' : '#98A0B3', background: hit ? '#FFE3F0' : '#F7F8FC', borderRadius: '11px', padding: '8px 6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all .3s' }}>{name}</div>
                      )
                    })}
                  </div>
                </div>
              </div>
              {walked && ladderRevealed && (
                <div style={{ alignSelf: 'center', fontSize: '16px', fontWeight: 900, color: '#E05B8B', background: '#FFE3F0', borderRadius: '999px', padding: '10px 26px', animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) both', boxShadow: '0 8px 24px rgba(224,91,139,.25)' }}>🎉 {names[ladderPicked]} → {results[walked.end]}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 의사결정하기 ===== */}
      {gameTab === 'decide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#fff', border: '2px solid #F0A2C0', borderRadius: '20px', padding: '16px 20px', boxShadow: '0 8px 24px rgba(224,91,139,.1)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>🗳️ 새 의사결정</span>
            <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startDecide()} placeholder="결정할 주제 (예: 이번 회식 장소는?)" style={{ flex: 1, minWidth: '220px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', padding: '10px 14px', color: '#232B3A' }} />
            <HoverButton onClick={startDecide} style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#F0729E,#E05B8B)', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(224,91,139,.3)', transition: 'transform .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)' }}>＋ 만들기</HoverButton>
          </div>

          {polls.map((poll) => {
            const options = poll.options
            const maxVotes = options.reduce((m, o) => Math.max(m, o.votes.length), 0)
            const totalVotes = options.reduce((sum, o) => sum + o.votes.length, 0)
            return (
              <div key={poll.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '18px 20px', boxShadow: '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFE3F0', display: 'grid', placeItems: 'center', fontSize: '17px', flexShrink: 0 }}>🗳️</span>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '15.5px', fontWeight: 900, letterSpacing: '-.01em' }}>{poll.topic}</div>
                    <div style={{ fontSize: '12px', color: '#98A0B3' }}>🔒 익명 투표함 · 총 {totalVotes}표 · 1인 1표</div>
                  </div>
                  <HoverButton onClick={() => { setPolls(polls); notify('"' + poll.topic + '" 저장 완료 — ' + options.length + '개 항목') }} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: '#fff', background: '#1F8A5B', border: 'none', borderRadius: '999px', padding: '7px 18px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31,138,91,.25)', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>저장</HoverButton>
                  <HoverButton onClick={() => setPolls(polls.filter((q) => q.id !== poll.id))} style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {options.map((o) => {
                    const isWinner = maxVotes > 0 && o.votes.length === maxVotes
                    const myVote = o.votes.includes(myName)
                    const pct = totalVotes ? Math.round((o.votes.length / totalVotes) * 100) : 0
                    const barW = (totalVotes ? Math.max(4, (o.votes.length / totalVotes) * 100) : 4) + '%'
                    return (
                      <div key={o.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '13px', padding: '11px 15px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barW, background: 'linear-gradient(90deg,rgba(255,227,240,.55),rgba(255,227,240,.2))', transition: 'width .4s ease', pointerEvents: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', position: 'relative', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#232B3A' }}>{o.text}</span>
                          {o.link && (
                            <HoverButton onClick={(e) => { e.stopPropagation(); window.open(o.link, '_blank') }} title="공유된 네이버맵 링크 열기" style={{ fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 800, color: '#0C8043', background: '#DDF5EA', border: 'none', borderRadius: '999px', padding: '4px 11px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>🗺️ 지도</HoverButton>
                          )}
                          <HoverButton onClick={(e) => { e.stopPropagation(); window.open('https://map.naver.com/index.nhn?menu=route&sname=' + encodeURIComponent('센트랄빌딩') + '&ename=' + encodeURIComponent(o.text), '_blank') }} title="센트랄빌딩 출발 길찾기" style={{ fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 700, color: '#4C6FFF', background: '#E8F0FF', border: 'none', borderRadius: '999px', padding: '4px 11px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.05)' }}>🚗 길찾기</HoverButton>
                          {isWinner && (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#E05B8B', background: '#FFE3F0', padding: '2px 9px', borderRadius: '999px' }}>👑 1위</span>
                          )}
                          <div style={{ flex: 1 }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#E05B8B' }}>{o.votes.length}표 · {pct}%</span>
                          <HoverButton
                            onClick={() => updatePoll(poll.id, {
                              options: options.map((q) => ({
                                ...q,
                                votes: q.id === o.id ? (myVote ? q.votes.filter((v) => v !== myName) : [...q.votes, myName]) : q.votes.filter((v) => v !== myName),
                              })),
                            })}
                            style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, color: myVote ? '#fff' : '#E05B8B', background: myVote ? '#E05B8B' : '#FFE3F0', border: 'none', borderRadius: '999px', padding: '6px 15px', cursor: 'pointer', transition: 'transform .15s' }}
                            hoverStyle={{ transform: 'scale(1.05)' }}
                          >
                            {myVote ? '✓ 투표함' : '투표'}
                          </HoverButton>
                          <HoverButton onClick={() => updatePoll(poll.id, { options: options.filter((q) => q.id !== o.id) })} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={optInputs[poll.id] || ''} onChange={(e) => setOptInputs({ ...optInputs, [poll.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addOpt(poll)} placeholder="선택지 추가 (예: 삼겹살집)" style={{ flex: 2, minWidth: '160px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px', padding: '10px 14px', color: '#232B3A', background: '#fff' }} />
                    <input value={linkInputs[poll.id] || ''} onChange={(e) => setLinkInputs({ ...linkInputs, [poll.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addOpt(poll)} placeholder="네이버맵 링크 (선택)" style={{ flex: 2, minWidth: '160px', border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px', padding: '10px 14px', color: '#232B3A', background: '#fff' }} />
                    <HoverButton onClick={() => addOpt(poll)} style={{ fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 800, color: '#E05B8B', background: '#FFE3F0', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.04)' }}>＋ 추가</HoverButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// 원본 makeConfetti 이식 — 결정적 의사난수로 조각 위치/색 계산
const CONFETTI_COLORS = ['#FFCBA0', '#F0729E', '#E05B8B', '#AECBFF', '#A9E8CC', '#D7C8FF', '#FFE3A3', '#FFD24C', '#7C5CFC', '#4C6FFF']
const CONFETTI_EMOJIS = ['🎉', '✨', '⭐', '💫', '🎊']
function Confetti({ count, big }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 5 }}>
      {Array.from({ length: count }, (_, i) => {
        const r1 = ((i * 9301 + 49297) % 233280) / 233280
        const r2 = ((i * 7621 + 12345) % 233280) / 233280
        const r3 = ((i * 4171 + 7919) % 233280) / 233280
        const ang = (i / count) * Math.PI * 2 + r1 * 0.6
        const dist = (big ? 150 : 110) + r2 * (big ? 260 : 190)
        const isEmoji = big && i % 7 === 0
        const isRibbon = !isEmoji && i % 4 === 0
        const base = {
          position: 'absolute',
          left: '50%',
          top: '50%',
          '--tx': Math.cos(ang) * dist + 'px',
          '--ty': Math.sin(ang) * dist - (big ? 90 : 60) - r1 * 100 + 'px',
          '--rot': (r1 > 0.5 ? '' : '-') + (360 + r2 * (big ? 900 : 540)) + 'deg',
          animation: 'confettiFly ' + ((big ? 3.2 : 0.9) + r1 * 1.8) + 's cubic-bezier(.18,.75,.35,1) ' + r3 * 0.5 + 's forwards',
          opacity: 0,
        }
        if (isEmoji) {
          return <div key={i} style={{ ...base, fontSize: 16 + r1 * 14 + 'px' }}>{CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]}</div>
        }
        return (
          <div key={i} style={{ ...base, width: (isRibbon ? 4 + r1 * 3 : 6 + r1 * 7) + 'px', height: (isRibbon ? 16 + r2 * 14 : 9 + r2 * 8) + 'px', background: CONFETTI_COLORS[i % CONFETTI_COLORS.length], borderRadius: i % 3 === 0 ? '50%' : '2px' }} />
        )
      })}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton, HoverDiv } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const ACCENT = '#D97757' // Claude 코럴
const CONSOLE_USAGE_URL = 'https://console.anthropic.com/settings/usage'

// 모델별 참고 단가 (1M 토큰당 USD) — 예상 비용 계산용(데모)
const RATES = {
  opus: { in: 15, out: 75 },
  sonnet: { in: 3, out: 15 },
  haiku: { in: 1, out: 5 },
}

// 기본 샘플(데모) 데이터 — 실제 연동 전까지 표시
const DEFAULT_USAGE = {
  plan: 'Team',
  budgetUsd: 300,
  requests: 4820,
  models: [
    { key: 'opus', name: 'Claude Opus 4.8', color: '#D97757', input: 3120000, output: 640000 },
    { key: 'sonnet', name: 'Claude Sonnet 4.6', color: '#9B7EDE', input: 8450000, output: 1220000 },
    { key: 'haiku', name: 'Claude Haiku 4.5', color: '#4F9DC4', input: 2010000, output: 380000 },
  ],
  daily: [380000, 420000, 510000, 350000, 690000, 720000, 210000, 260000, 880000, 610000, 540000, 730000, 900000, 640000],
}

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
function genRandom() {
  return {
    plan: 'Team',
    budgetUsd: 300,
    requests: rnd(2000, 9000),
    models: [
      { key: 'opus', name: 'Claude Opus 4.8', color: '#D97757', input: rnd(1000000, 5000000), output: rnd(200000, 900000) },
      { key: 'sonnet', name: 'Claude Sonnet 4.6', color: '#9B7EDE', input: rnd(4000000, 12000000), output: rnd(600000, 1800000) },
      { key: 'haiku', name: 'Claude Haiku 4.5', color: '#4F9DC4', input: rnd(800000, 3000000), output: rnd(150000, 600000) },
    ],
    daily: Array.from({ length: 14 }, () => rnd(150000, 950000)),
  }
}

const fmtTokens = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n))
const fmtUsd = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const modelCost = (m) => (m.input / 1e6) * RATES[m.key].in + (m.output / 1e6) * RATES[m.key].out

export default function ClaudeUsage() {
  const navigate = useNavigate()
  const notify = useToast()
  const [data, setData] = useLocalStorage('sd1-portal-claude-usage', DEFAULT_USAGE)
  const [consoleHover, setConsoleHover] = useState(false)

  const models = data.models || []
  const totalTokens = models.reduce((s, m) => s + m.input + m.output, 0)
  const totalInput = models.reduce((s, m) => s + m.input, 0)
  const totalOutput = models.reduce((s, m) => s + m.output, 0)
  const totalCost = models.reduce((s, m) => s + modelCost(m), 0)
  const budget = data.budgetUsd || 0
  const budgetPct = budget ? Math.min(100, (totalCost / budget) * 100) : 0
  const over = budget && totalCost > budget

  const daily = data.daily || []
  const dayMax = Math.max(1, ...daily)
  const now = new Date()
  const dayLabels = Array.from({ length: daily.length }, (_, i) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() - (daily.length - 1 - i))
    return dt.getMonth() + 1 + '/' + dt.getDate()
  })

  const summary = [
    { label: '총 토큰 (이번 달)', value: fmtTokens(totalTokens), sub: '입력 ' + fmtTokens(totalInput) + ' · 출력 ' + fmtTokens(totalOutput), ink: ACCENT },
    { label: '예상 비용', value: fmtUsd(totalCost), sub: '단가 기준 추정치', ink: '#1F8A5B' },
    { label: '요청 수', value: (data.requests || 0).toLocaleString(), sub: '누적 API 호출', ink: '#4C6FFF' },
    { label: '예산 사용률', value: Math.round(budgetPct) + '%', sub: fmtUsd(totalCost) + ' / ' + fmtUsd(budget), ink: over ? '#E05B5B' : '#7C5CFC' },
  ]

  const regenerate = () => {
    setData(genRandom())
    notify('데모 사용량 데이터를 새로 생성했어요')
  }

  return (
    <section data-screen-label="Claude 사용량">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#FBEAE3,#F6D8CB)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>🤖</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>Claude 사용량</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>이번 달 토큰 사용 현황 · {data.plan} 플랜</p>
        </div>
        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#B0762F', background: '#FFF3E4', border: '1px solid #F3DBBE', padding: '5px 12px', borderRadius: '999px' }}>데모 데이터</span>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '13px', marginBottom: '16px' }}>
        {summary.map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#98A0B3' }}>{s.label}</span>
            <span style={{ fontSize: '25px', fontWeight: 900, letterSpacing: '-.02em', color: s.ink }}>{s.value}</span>
            <span style={{ fontSize: '12px', color: '#98A0B3' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* 예산 진행바 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '18px 20px', boxShadow: cardShadow, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800 }}>월 예산 사용</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: over ? '#E05B5B' : '#737E92' }}>{fmtUsd(totalCost)} / {fmtUsd(budget)}{over ? ' · 초과!' : ''}</span>
        </div>
        <div style={{ height: '12px', background: '#F1F3F7', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: budgetPct + '%', height: '100%', borderRadius: '999px', background: over ? 'linear-gradient(90deg,#F0895B,#E05B5B)' : 'linear-gradient(90deg,#E8A277,#D97757)', transition: 'width .4s ease' }} />
        </div>
      </div>

      {/* 모델별 사용량 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '18px 20px', boxShadow: cardShadow, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800 }}>모델별 사용량</div>
        {models.map((m) => {
          const mt = m.input + m.output
          const share = totalTokens ? (mt / totalTokens) * 100 : 0
          return (
            <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#232B3A' }}>{m.name}</span>
                <span style={{ fontSize: '12px', color: '#98A0B3' }}>입력 {fmtTokens(m.input)} · 출력 {fmtTokens(m.output)}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#4A5468' }}>{fmtTokens(mt)}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F8A5B', minWidth: '64px', textAlign: 'right' }}>{fmtUsd(modelCost(m))}</span>
              </div>
              <div style={{ height: '9px', background: '#F4F6FA', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: share + '%', height: '100%', borderRadius: '999px', background: m.color, transition: 'width .4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 일별 사용량 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '18px', padding: '18px 20px', boxShadow: cardShadow, marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>최근 {daily.length}일 일별 토큰</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
          {daily.map((v, i) => (
            <HoverDiv
              key={i}
              title={dayLabels[i] + ' · ' + v.toLocaleString() + ' 토큰'}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', height: '100%' }}
              hoverStyle={{}}
            >
              <div style={{ width: '100%', maxWidth: '26px', height: Math.max(4, (v / dayMax) * 108) + 'px', borderRadius: '6px 6px 3px 3px', background: 'linear-gradient(180deg,#E8A277,#D97757)' }} />
              <span style={{ fontSize: '10px', color: '#B0B7C7', fontWeight: 600, whiteSpace: 'nowrap' }}>{dayLabels[i]}</span>
            </HoverDiv>
          ))}
        </div>
      </div>

      {/* 안내 & 액션 */}
      <div style={{ background: 'linear-gradient(135deg,#FBEAE3,#FDF3EC)', border: '1px solid #F3DBBE', borderRadius: '18px', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', fontSize: '13px', color: '#8A5A2E', lineHeight: 1.7 }}>
          위 수치는 <b>데모 샘플</b>이에요. 실제 사용량은 Anthropic 콘솔에서 확인할 수 있고, 이 화면에 실제 데이터를 연결하려면 Admin API를 호출하는 백엔드 프록시가 필요해요.
        </div>
        <a
          href={CONSOLE_USAGE_URL}
          target="_blank"
          rel="noopener"
          onMouseEnter={() => setConsoleHover(true)}
          onMouseLeave={() => setConsoleHover(false)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#E8825A,#D97757)', padding: '11px 20px', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(217,119,87,.3)', transition: 'transform .15s ease', ...(consoleHover ? { transform: 'translateY(-2px)' } : null) }}
        >
          콘솔에서 실제 사용량 보기 ↗
        </a>
        <HoverButton
          onClick={regenerate}
          style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#B0762F', background: '#fff', border: '1px solid #F3DBBE', padding: '11px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all .15s' }}
          hoverStyle={{ color: ACCENT, border: '1px solid #E8A277' }}
        >
          🎲 데모 새로고침
        </HoverButton>
      </div>
    </section>
  )
}

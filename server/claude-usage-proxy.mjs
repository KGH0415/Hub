/**
 * Claude 사용량 프록시 (예시)
 * ------------------------------------------------------------------
 * 브라우저는 Anthropic Admin API를 직접 호출할 수 없다(CORS·보안). 이 작은 서버가
 * 서버 측에서 Admin API를 호출해 집계한 뒤, ClaudeUsage.jsx가 그대로 쓰는 JSON 형태로 돌려준다.
 *
 * 필요한 것: Node 18+ (전역 fetch 내장). 외부 의존성 없음.
 *
 * 실행:
 *   # Anthropic 콘솔 → Settings → Admin keys 에서 발급한 관리자 키 (sk-ant-admin...)
 *   export ANTHROPIC_ADMIN_KEY=sk-ant-admin-xxxxxxxx      # (PowerShell) $env:ANTHROPIC_ADMIN_KEY="..."
 *   export CLAUDE_BUDGET_USD=300                          # 선택: 월 예산(예상 비용 게이지 기준)
 *   node server/claude-usage-proxy.mjs
 *   # → http://localhost:8787/api/claude-usage
 *
 * 프런트 연결 (ClaudeUsage.jsx): useLocalStorage 기본값 대신 아래처럼 불러오면 된다.
 *   const [data, setData] = useState(DEFAULT_USAGE)   // 로딩 전 데모로 시작
 *   useEffect(() => {
 *     fetch(import.meta.env.VITE_CLAUDE_USAGE_API)     // 예: http://localhost:8787/api/claude-usage
 *       .then(r => r.json()).then(setData).catch(() => {})  // 실패 시 데모 유지
 *   }, [])
 * (.env.local 에 VITE_CLAUDE_USAGE_API=http://localhost:8787/api/claude-usage)
 * ------------------------------------------------------------------
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY || ''
const BUDGET_USD = Number(process.env.CLAUDE_BUDGET_USD || 300)
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'
const API_BASE = 'https://api.anthropic.com/v1/organizations'

// 모델 ID → 화면 표시용 메타
function mapModel(id) {
  const s = (id || '').toLowerCase()
  if (s.includes('opus')) return { key: 'opus', name: id, color: '#D97757' }
  if (s.includes('sonnet')) return { key: 'sonnet', name: id, color: '#9B7EDE' }
  if (s.includes('haiku')) return { key: 'haiku', name: id, color: '#4F9DC4' }
  return { key: s || 'other', name: id || '기타', color: '#98A0B3' }
}

// Admin API GET (페이지네이션 자동 처리) → 모든 버킷(data[]) 반환
async function fetchAllBuckets(path, params) {
  const buckets = []
  let page = null
  do {
    const url = new URL(API_BASE + path)
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x))
      else url.searchParams.set(k, v)
    }
    if (page) url.searchParams.set('page', page)
    const res = await fetch(url, {
      headers: { 'x-api-key': ADMIN_KEY, 'anthropic-version': '2023-06-01' },
    })
    if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`)
    const json = await res.json()
    buckets.push(...(json.data || []))
    page = json.has_more ? json.next_page : null
  } while (page)
  return buckets
}

// ISO(UTC) 자정 문자열
const isoDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()

async function buildUsage() {
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const fourteenAgo = new Date(now)
  fourteenAgo.setUTCDate(fourteenAgo.getUTCDate() - 13)
  // 이번 달과 최근 14일을 모두 포함하도록 더 이른 시작일 사용
  const startingAt = isoDay(startOfMonth < fourteenAgo ? startOfMonth : fourteenAgo)

  // 1) 메시지 토큰 사용량: 일 단위 버킷, 모델별 그룹
  const usage = await fetchAllBuckets('/usage_report/messages', {
    starting_at: startingAt,
    bucket_width: '1d',
    'group_by[]': 'model',
    limit: '31',
  })

  const modelTotals = {} // { modelId: { input, output } }
  const perDay = [] // [{ tokens }]
  for (const bucket of usage) {
    let dayTokens = 0
    for (const r of bucket.results || []) {
      const input =
        (r.uncached_input_tokens || 0) +
        (r.cache_creation_input_tokens || 0) +
        (r.cache_read_input_tokens || 0)
      const output = r.output_tokens || 0
      dayTokens += input + output
      const id = r.model || 'unknown'
      const t = (modelTotals[id] ||= { input: 0, output: 0 })
      t.input += input
      t.output += output
    }
    perDay.push({ tokens: dayTokens })
  }

  const models = Object.entries(modelTotals)
    .map(([id, t]) => ({ ...mapModel(id), input: t.input, output: t.output }))
    .sort((a, b) => b.input + b.output - (a.input + a.output))

  // 최근 14개 일 버킷 (화면은 라벨을 자체 계산하므로 개수만 맞추면 됨)
  const daily = perDay.slice(-14).map((x) => x.tokens)

  // 2) (선택) 비용 리포트 — 실제 청구 비용. 화면 게이지는 토큰×단가 추정이지만,
  //    실제 비용을 쓰고 싶으면 costUsd 를 함께 내려 화면에서 사용하도록 바꾸면 된다.
  let costUsd = null
  try {
    const cost = await fetchAllBuckets('/cost_report', { starting_at: isoDay(startOfMonth), bucket_width: '1d' })
    costUsd = cost.reduce(
      (sum, b) => sum + (b.results || []).reduce((s, r) => s + Number(r.amount || 0), 0),
      0,
    )
  } catch {
    /* cost_report 접근 불가 시 무시 */
  }

  return {
    plan: 'Team',
    budgetUsd: BUDGET_USD,
    // Admin usage API는 '요청 수'를 제공하지 않는다 → null (화면에서 숨기거나 별도 소스 필요)
    requests: null,
    models,
    daily,
    costUsd, // 화면 기본형에는 없지만 참고용으로 함께 제공
    updatedAt: now.toISOString(),
  }
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end()
    return
  }
  if (!req.url.startsWith('/api/claude-usage')) {
    res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'not found' }))
    return
  }
  if (!ADMIN_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'ANTHROPIC_ADMIN_KEY 환경변수가 없습니다.' }))
    return
  }
  try {
    const data = await buildUsage()
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(data))
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: String(err.message || err) }))
  }
})

server.listen(PORT, () => {
  console.log(`Claude 사용량 프록시 실행 중 → http://localhost:${PORT}/api/claude-usage`)
  if (!ADMIN_KEY) console.warn('⚠️  ANTHROPIC_ADMIN_KEY 가 설정되지 않았습니다. 요청 시 500을 반환합니다.')
})

/*
 * ── 서버리스(Vercel / Netlify / Cloud Functions) 변형 ────────────────
 * 위 buildUsage() 를 그대로 재사용하고 핸들러만 감싼다:
 *
 *   // Vercel: /api/claude-usage.mjs
 *   export default async function handler(req, res) {
 *     res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || '*')
 *     if (req.method === 'OPTIONS') return res.status(204).end()
 *     try { res.status(200).json(await buildUsage()) }
 *     catch (e) { res.status(502).json({ error: String(e.message || e) }) }
 *   }
 *
 *   // Google Cloud Functions (functions-framework):
 *   export const claudeUsage = async (req, res) => {
 *     res.set('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || '*')
 *     if (req.method === 'OPTIONS') return res.status(204).send('')
 *     try { res.json(await buildUsage()) }
 *     catch (e) { res.status(502).json({ error: String(e.message || e) }) }
 *   }
 *
 * 배포 환경변수: ANTHROPIC_ADMIN_KEY, (선택) CLAUDE_BUDGET_USD, ALLOW_ORIGIN
 * ADMIN_KEY 는 서버 환경변수로만 두고 절대 프런트 번들에 넣지 말 것.
 */

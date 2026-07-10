import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortal } from '../context/PortalContext'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'
import { CAFETERIAS } from './Meal'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const NOTICE_DEFAULT_TEXT = '이번 주 금요일 17:00 전사 안전교육이 있습니다 · 7/10(금) 월급날입니다 · 사내 포털 개선 의견은 익명 게시판에 남겨주세요'
const NOTICE_STYLE_KEYS = ['plain', 'rainbow', 'blink']
const clsOf = (k) => (k === 'rainbow' ? 'notice-rainbow' : k === 'blink' ? 'notice-blink' : '')

const QUOTES = [
  { text: '성공은 매일 반복한 작은 노력들의 합이다.', author: '로버트 콜리어' },
  { text: '가장 큰 위험은 위험 없는 삶이다.', author: '스티븐 코비' },
  { text: '완벽함이 아니라 꾸준함이 성장을 만든다.', author: '제임스 클리어' },
  { text: '미래를 예측하는 가장 좋은 방법은 미래를 만드는 것이다.', author: '피터 드러커' },
  { text: '단순함은 궁극의 정교함이다.', author: '레오나르도 다빈치' },
  { text: '천 리 길도 한 걸음부터.', author: '노자' },
  { text: '어제보다 나은 오늘이면 충분하다.', author: '작자 미상' },
  { text: '문제를 해결할 수 없다면, 그것은 문제가 아니라 사실이다.', author: '시몬 드 보부아르' },
  { text: '배움을 멈추는 순간, 성장도 멈춘다.', author: '알베르트 아인슈타인' },
  { text: '위대한 일은 작은 일들이 모여 이루어진다.', author: '빈센트 반 고흐' },
  { text: '행동은 모든 성공의 기본 열쇠다.', author: '파블로 피카소' },
  { text: '기회는 준비된 자에게 온다.', author: '루이 파스퇴르' },
  { text: '느려도 괜찮다. 멈추지만 않는다면.', author: '공자' },
  { text: '오늘 할 수 있는 일에 전력을 다하라.', author: '아이작 뉴턴' },
]

const HOLIDAYS = {
  '2025-1-1': '신정', '2025-1-28': '설날', '2025-1-29': '설날', '2025-1-30': '설날',
  '2025-3-1': '삼일절', '2025-3-3': '대체공휴일', '2025-5-5': '어린이날·부처님오신날', '2025-5-6': '대체공휴일',
  '2025-6-6': '현충일', '2025-8-15': '광복절', '2025-10-3': '개천절',
  '2025-10-5': '추석', '2025-10-6': '추석', '2025-10-7': '추석', '2025-10-8': '대체공휴일',
  '2025-10-9': '한글날', '2025-12-25': '성탄절',
  '2026-1-1': '신정', '2026-2-16': '설날', '2026-2-17': '설날', '2026-2-18': '설날',
  '2026-3-1': '삼일절', '2026-3-2': '대체공휴일', '2026-5-5': '어린이날', '2026-5-24': '부처님오신날', '2026-5-25': '대체공휴일',
  '2026-6-6': '현충일', '2026-8-15': '광복절', '2026-8-17': '대체공휴일',
  '2026-9-24': '추석', '2026-9-25': '추석', '2026-9-26': '추석',
  '2026-10-3': '개천절', '2026-10-5': '대체공휴일', '2026-10-9': '한글날', '2026-12-25': '성탄절',
  '2027-1-1': '신정', '2027-2-6': '설날', '2027-2-7': '설날', '2027-2-8': '설날', '2027-2-9': '대체공휴일',
  '2027-3-1': '삼일절', '2027-5-5': '어린이날', '2027-5-13': '부처님오신날',
  '2027-6-6': '현충일', '2027-8-15': '광복절', '2027-8-16': '대체공휴일',
  '2027-9-14': '추석', '2027-9-15': '추석', '2027-9-16': '추석',
  '2027-10-3': '개천절', '2027-10-4': '대체공휴일', '2027-10-9': '한글날', '2027-10-11': '대체공휴일', '2027-12-25': '성탄절',
}
const CAL_DOWS = [
  { name: '일', ink: '#E05B5B' }, { name: '월', ink: '#98A0B3' }, { name: '화', ink: '#98A0B3' },
  { name: '수', ink: '#98A0B3' }, { name: '목', ink: '#98A0B3' }, { name: '금', ink: '#98A0B3' }, { name: '토', ink: '#4C6FFF' },
]

const pad = (n) => String(n).padStart(2, '0')
const todayStr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
function statusOf(n, today) {
  if (n.start && n.start > today) return '예정'
  if (n.end && n.end < today) return '종료'
  return '게시중'
}
function weatherView(w) {
  if (!w || w.temp == null) return { has: false }
  const c = w.code
  let emoji = '☀️', anim = 'weatherSpin 14s linear infinite'
  if (c >= 1 && c <= 2) { emoji = '🌤️'; anim = 'floaty 4s ease-in-out infinite' }
  else if (c === 3) { emoji = '☁️'; anim = 'weatherDrift 5s ease-in-out infinite' }
  else if (c >= 45 && c <= 48) { emoji = '🌫️'; anim = 'weatherDrift 6s ease-in-out infinite' }
  else if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) { emoji = '🌧️'; anim = 'weatherBob 1.6s ease-in-out infinite' }
  else if ((c >= 71 && c <= 77) || (c >= 85 && c <= 86)) { emoji = '❄️'; anim = 'weatherSpin 8s linear infinite' }
  else if (c >= 95) { emoji = '⛈️'; anim = 'weatherShake .8s ease-in-out infinite' }
  return { has: true, emoji, temp: w.temp + '°', anim }
}
const cleanMain = (s) => s.replace(/\s*\(?특식\)?/g, '').trim()

// 42칸 달력 셀 생성 (공휴일·월급날 표시 포함)
function buildCalendar(base, now) {
  const first = new Date(base.y, base.m, 1)
  const daysInMonth = new Date(base.y, base.m + 1, 0).getDate()
  const startDow = first.getDay()
  const isThisMonth = base.y === now.getFullYear() && base.m === now.getMonth()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push({ key: 'e' + i, empty: true })
  let payday = 10
  const dow10 = new Date(base.y, base.m, 10).getDay()
  if (dow10 === 6) payday = 9
  else if (dow10 === 0) payday = 8
  for (let day = 1; day <= daysInMonth; day++) {
    const dow = (startDow + day - 1) % 7
    const isToday = isThisMonth && day === now.getDate()
    const holiday = HOLIDAYS[base.y + '-' + (base.m + 1) + '-' + day] || null
    const isPay = day === payday
    const label = [holiday, isPay ? '💰 월급날' : null].filter(Boolean).join(' · ') || null
    cells.push({
      key: 'd' + day, empty: false, day, holiday: label,
      ink: isToday ? '#fff' : holiday || dow === 0 ? '#E05B5B' : isPay ? '#1F8A5B' : dow === 6 ? '#4C6FFF' : '#4A5468',
      bg: isToday ? '#7C5CFC' : isPay ? '#DDF5EA' : 'transparent',
      weight: isToday ? 900 : holiday || isPay ? 800 : 600,
    })
  }
  while (cells.length < 42) cells.push({ key: 'p' + cells.length, empty: true, ink: 'transparent', bg: 'transparent', weight: 400 })
  return cells
}

const glass = { background: 'rgba(255,255,255,.55)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '14px', backdropFilter: 'blur(4px)' }

export default function Home() {
  const navigate = useNavigate()
  const { uid, userName } = useAuth()
  const { weather, news } = usePortal() // news/weather + 30초 시계 tick 유발
  const notify = useToast()

  const [notices, setNotices] = useLocalStorage('sd1-portal-notices', [{ id: 'n1', text: NOTICE_DEFAULT_TEXT, start: '', end: '', who: '', ts: null }])
  const [memo, setMemo] = useLocalStorage('sd1-portal-memo-' + uid, '', { raw: true })
  const [todos, setTodos] = useLocalStorage('sd1-portal-todos-' + uid, [])
  const [docs] = useLocalStorage('sd1-portal-docs', null)
  const [board] = useLocalStorage('sd1-portal-board', null)
  const [maint] = useLocalStorage('sd1-portal-maint', null)
  const [gitlabUrl] = useLocalStorage('sd1-portal-gitlabUrl', '', { raw: true })
  const [snackSession] = useLocalStorage('sd1-portal-snack-session', null)
  const [syslinks] = useLocalStorage('sd1-portal-syslinks', null)
  const [menu0] = useLocalStorage('sd1-portal-menu-0', null)
  const [cardOrder, setCardOrder] = useLocalStorage('sd1-portal-cardorder-' + uid, [])
  const dragCard = useRef(null)

  const [calOpen, setCalOpen] = useState(false)
  const [calMonth, setCalMonth] = useState(null)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [noticeEditId, setNoticeEditId] = useState(null)
  const [noticeHidden, setNoticeHidden] = useState(false)

  const d = new Date()
  const who = userName + '님'

  // ===== 인사말 / 날짜 / 시계 =====
  const h = d.getHours()
  const greeting = h < 11 ? '좋은 아침이에요' : h < 14 ? '점심 맛있게 드세요' : h < 18 ? '좋은 오후예요' : '오늘 하루 수고하셨어요'
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const todayLabel = d.getMonth() + 1 + '월 ' + d.getDate() + '일 ' + days[d.getDay()] + '요일'
  const clockLabel = (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + pad(d.getMinutes())
  const wv = weatherView(weather)
  // 감지된 지역명으로 네이버 날씨 검색 (지역 미상이면 네이버가 IP로 자동 위치)
  const weatherHref = 'https://search.naver.com/search.naver?query=' + encodeURIComponent((weather?.city ? weather.city + ' ' : '') + '날씨')

  // ===== 퇴근 / 월급 D-day =====
  const isWeekend = d.getDay() === 0 || d.getDay() === 6
  const mins = h * 60 + d.getMinutes()
  const onMins = 8 * 60 + 30
  const offMins = 17 * 60 + 30
  let offTitle = '퇴근까지', offLabel, offEmoji = '⏳'
  if (isWeekend) { offTitle = '오늘은'; offLabel = '주말이에요 🎉'; offEmoji = '🏖️' }
  else if (mins >= offMins) { offTitle = '오늘은'; offLabel = '퇴근 시간이에요!'; offEmoji = '🏃' }
  else if (mins < onMins) { offTitle = '업무 시작까지'; offLabel = Math.floor((onMins - mins) / 60) + '시간 ' + ((onMins - mins) % 60) + '분'; offEmoji = '🌅' }
  else { const left = offMins - mins; offLabel = Math.floor(left / 60) + '시간 ' + (left % 60) + '분' }
  const paydayOf = (y, m) => {
    let p = 10
    const dw = new Date(y, m, 10).getDay()
    if (dw === 6) p = 9
    else if (dw === 0) p = 8
    return new Date(y, m, p)
  }
  const today0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  let pay = paydayOf(d.getFullYear(), d.getMonth())
  if (pay < today0) pay = paydayOf(d.getFullYear(), d.getMonth() + 1)
  const dDays = Math.round((pay - today0) / 86400000)
  const payLabel = dDays === 0 ? '오늘이에요! 🎉' : 'D-' + dDays + ' (' + (pay.getMonth() + 1) + '/' + pay.getDate() + ')'

  // ===== 오늘 점심 (경남신문 식당 기준) =====
  const week0 = Array.isArray(menu0) && menu0.length === 5 ? menu0 : CAFETERIAS[0].week
  let todayIdx = d.getDay() - 1
  if (todayIdx < 0 || todayIdx > 4) todayIdx = 0
  const heroLunch = cleanMain(week0[todayIdx].main)

  // ===== 명언 / 뉴스 =====
  const dayKey = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  const quote = QUOTES[dayKey % QUOTES.length]
  const newsItems = news?.items || []
  const newsCur = newsItems.length ? newsItems[news.idx % newsItems.length] : null
  const newsTitle = newsCur ? newsCur.title : '실시간 IT·AI 헤드라인을 불러오는 중…'
  const newsUrl = newsCur ? newsCur.url : 'https://news.hada.io'
  const newsCounter = newsCur ? (news.idx % newsItems.length) + 1 + '/' + newsItems.length : ''

  // ===== 공지 =====
  const today = todayStr(d)
  const activeNotices = notices.filter((n) => statusOf(n, today) === '게시중')
  // 게시일이 겹치는(동시에 게시중인) 공지는 우선순위 오름차순(숫자가 작을수록 먼저)으로 정렬.
  // 안내 문구 없이 티커를 비워 둔다 (행 자체는 항상 표시)
  const noticeParts = activeNotices
    .filter((n) => n.text)
    .slice()
    .sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1))
    .map((n) => ({ text: n.text, cls: clsOf(n.styleType) }))
  const editingNotice = notices.find((n) => n.id === noticeEditId) || activeNotices[0] || notices[0] || null
  const touchNotice = (patch) => {
    if (!editingNotice) return
    setNotices(notices.map((n) => (n.id === editingNotice.id ? { ...n, ...patch, who, ts: Date.now() } : n)))
  }
  const openNotice = () => {
    let target = activeNotices[0] || notices[0]
    if (!target) {
      target = { id: 'n' + Date.now(), text: '', start: '', end: '', who: '', ts: null }
      setNotices([target])
    }
    setNoticeEditId(target.id)
    setNoticeOpen(true)
  }
  const resetNotice = () => { touchNotice({ text: NOTICE_DEFAULT_TEXT, start: '', end: '' }); notify('공지를 초기화했어요') }
  const noticeMetaLabel = editingNotice && editingNotice.ts
    ? (() => { const t = new Date(editingNotice.ts); return '최근 수정: ' + editingNotice.who + ' · ' + t.getFullYear() + '.' + pad(t.getMonth() + 1) + '.' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) })()
    : ''

  // ===== 메모 (useLocalStorage가 입력 즉시 저장) =====
  const onMemoText = (e) => setMemo(e.target.value)
  const clearMemo = () => setMemo('')
  const memoToTodo = () => {
    const text = (memo || '').trim()
    if (!text) { notify('저장할 메모 내용이 없어요'); return }
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    setTodos([...lines.map((t, i) => ({ id: 't' + (Date.now() + i), text: t, done: false, ts: Date.now() })), ...todos])
    notify('✅ TODOLIST에 ' + lines.length + '개 항목으로 저장했어요')
  }

  // ===== 캘린더 =====
  const calBase = calMonth || { y: d.getFullYear(), m: d.getMonth() }
  const calTitle = calBase.y + '년 ' + (calBase.m + 1) + '월'
  const calCells = buildCalendar(calBase, d)
  const moveCal = (delta) => {
    let m = calBase.m + delta, y = calBase.y
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalMonth({ y, m })
  }
  const openCal = () => { setCalMonth(null); setCalOpen(true) }

  // ===== 카드 배지 =====
  const remaining = todos.filter((t) => !t.done).length
  const todoBadge = todos.length ? (remaining ? remaining + '개 남음' : '모두 완료 🎉') : null
  const docCount = Array.isArray(docs) ? docs.length : 4
  const boardCount = Array.isArray(board) ? board.length : 2
  const maintCount = Array.isArray(maint) ? maint.length : 0
  const gitlabReady = !!gitlabUrl
  const sysCount = Array.isArray(syslinks) ? syslinks.length : 3
  const snackToday = (() => {
    const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    return snackSession && snackSession.date === k ? snackSession : null
  })()

  const openWakbu = () => window.open('http://localhost:3300/3d', '_blank')
  const CARDS = [
    { key: 'todo', go: () => navigate('/todo'), icon: '✅', grad: 'linear-gradient(135deg,#EFE9FF,#E2D7FF)', ink: '#7C5CFC', title: '나의 TODOLIST', desc: '나만 보는 할 일 목록', cta: '할 일 보기', hb: '#DED2FF', hs: 'rgba(124,92,252,.12)', badge: todoBadge && { text: todoBadge, bg: '#EFE9FF', ink: '#7C5CFC' } },
    { key: 'meal', go: () => navigate('/meal'), icon: '🍚', grad: 'linear-gradient(135deg,#FFF1E6,#FFE3CB)', ink: '#E8823A', title: '오늘의 식단', desc: '경남신문 · 국민연금 식당 주간 식단', cta: '이번 주 식단 보기', hb: '#FFDDC2', hs: 'rgba(232,130,58,.1)' },
    { key: 'docs', go: () => navigate('/docs'), icon: '📄', grad: 'linear-gradient(135deg,#E8F0FF,#D7E4FF)', ink: '#4C6FFF', title: '이번 주 회의자료', desc: '주간회의 공유자료 모음', cta: '목록 보기', hb: '#CCDAFF', hs: 'rgba(76,111,255,.1)', badge: { text: docCount + '건', bg: '#EDF2FF', ink: '#4C6FFF' } },
    { key: 'board', go: () => navigate('/board'), icon: '💬', grad: 'linear-gradient(135deg,#E3F5F8,#CDEBF1)', ink: '#3AA6B9', title: '익명 게시판', desc: '이름 없이 자유롭게 한마디', cta: '게시판 가기', hb: '#BCE4EC', hs: 'rgba(58,166,185,.1)', badge: { text: boardCount + '개의 글', bg: '#E3F5F8', ink: '#3AA6B9' } },
    { key: 'maint', go: () => navigate('/maint'), icon: '📊', grad: 'linear-gradient(135deg,#E2F2E9,#CBE7D8)', ink: '#217346', title: '유지보수 내역', desc: '엑셀 파일을 올려서 한눈에 보기', cta: '내역 보기', hb: '#BBDCC9', hs: 'rgba(33,115,70,.12)', badge: maintCount ? { text: maintCount + '개 파일', bg: '#E2F2E9', ink: '#217346' } : null },
    { key: 'gitlab', go: () => navigate('/gitlab'), icon: '🦊', grad: 'linear-gradient(135deg,#FDEAE2,#FAD6C6)', ink: '#E2542C', title: 'GitLab 커밋 이력', desc: '프로젝트별 최근 커밋 보기', cta: '커밋 보러가기', hb: '#F5C8B8', hs: 'rgba(226,84,44,.12)', badge: gitlabReady ? { text: '연결됨', bg: '#FDEAE2', ink: '#E2542C' } : null },
    { key: 'snack', go: () => navigate('/snack'), icon: '🌙', grad: 'linear-gradient(135deg,#E8EAF8,#D6DAF2)', ink: '#5560A4', title: '야식 주문하기', desc: '오늘 야근엔 뭐 먹을까요', cta: '주문 접수하기', hb: '#C7CCEC', hs: 'rgba(85,96,164,.12)', badge: snackToday && { text: '🔔 ' + snackToday.store + ' 진행 중', bg: '#5560A4', ink: '#fff', blink: true, shadow: '0 4px 12px rgba(85,96,164,.35)' } },
    { key: 'sysurl', go: () => navigate('/sysurl'), icon: '🔗', grad: 'linear-gradient(135deg,#FFF6DE,#FBEDC4)', ink: '#C99A2E', title: '시스템 접속URL', desc: '자주 쓰는 사내 시스템 모음', cta: '목록 보기', hb: '#F0DDAB', hs: 'rgba(201,154,46,.12)', badge: { text: sysCount + '개', bg: '#FFF6DE', ink: '#C99A2E' } },
    { key: 'random', go: () => navigate('/random'), icon: '🎲', grad: 'linear-gradient(135deg,#FFE3F0,#FFD0E3)', ink: '#E05B8B', title: '결정 도우미', desc: '룰렛 · 사다리 · 의사결정 투표', cta: '결정하러 가기', hb: '#FFCBDE', hs: 'rgba(224,91,139,.1)' },
    { key: 'claude', go: () => navigate('/claude'), icon: '🤖', grad: 'linear-gradient(135deg,#FBEAE3,#F6D8CB)', ink: '#D97757', title: 'Claude 사용량', desc: '내 토큰·비용 사용 현황', cta: '사용량 보기', hb: '#F3DBBE', hs: 'rgba(217,119,87,.12)', badge: { text: '데모', bg: '#FFF3E4', ink: '#B0762F' } },
    { key: 'wiki', go: () => notify('사내 위키 — 실제 서비스에서는 새 탭으로 연결돼요'), icon: '📚', grad: 'linear-gradient(135deg,#EFE9FF,#E2D7FF)', ink: '#7C5CFC', title: '사내 위키', desc: '프로젝트·업무 문서 아카이브', cta: 'wiki.company.com 열기', hb: '#DED2FF', hs: 'rgba(124,92,252,.1)', badge: { text: '외부 링크 ↗', bg: '#F1F3F7', ink: '#98A0B3' } },
    { key: 'meta', go: openWakbu, icon: '🌐', grad: 'linear-gradient(135deg,#E4F7F0,#CBEEDD)', ink: '#2FA36B', title: '사내 메타버스', desc: '가상 오피스 공간 입장', cta: 'localhost:3300/3d 입장', hb: '#BEE8D4', hs: 'rgba(47,163,107,.1)', badge: { text: '외부 링크 ↗', bg: '#F1F3F7', ink: '#98A0B3' } },
    { key: 'wakbu', go: openWakbu, icon: '🗺️', grad: 'linear-gradient(135deg,#DFF5F5,#C4ECEC)', ink: '#0F9D9F', title: '왁뿌MAP', desc: '메타버스 맵으로 바로 이동', cta: '맵 열기', hb: '#A9E0E1', hs: 'rgba(15,157,159,.12)', badge: { text: '외부 링크 ↗', bg: '#F1F3F7', ink: '#98A0B3' } },
  ]

  // 드래그 재정렬: 저장된 순서(유효 키만) + 누락된 키를 뒤에 append
  const cardKeys = CARDS.map((c) => c.key)
  const cardSeq = cardOrder.filter((k) => cardKeys.includes(k)).concat(cardKeys.filter((k) => !cardOrder.includes(k)))
  const orderedCards = cardSeq.map((k) => CARDS.find((c) => c.key === k))
  const onCardDrop = (k) => {
    const from = dragCard.current
    dragCard.current = null
    if (!from || from === k) return
    const next = cardSeq.filter((x) => x !== from)
    next.splice(next.indexOf(k), 0, from)
    setCardOrder(next)
  }

  return (
    <section data-screen-label="홈" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 110px)' }}>
      {/* 히어로 */}
      <div style={{ borderRadius: '24px', background: 'linear-gradient(115deg,#FFE7CF 0%,#FFF3E4 38%,#F3EDFF 78%,#E9F0FF 100%)', padding: '22px 26px 20px', marginBottom: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 2px rgba(35,43,58,.03), 0 12px 32px rgba(226,178,120,.16)' }}>
        <div style={{ position: 'absolute', right: '-36px', top: '-42px', width: '190px', height: '190px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FFD98F, #FFAE58)', opacity: 0.55, filter: 'blur(3px)', animation: 'floaty 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '96px', top: '74px', width: '64px', height: '64px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #E4D8FF, #C4AEFF)', opacity: 0.5, filter: 'blur(2px)', animation: 'floaty 9s ease-in-out infinite reverse' }} />
        <div style={{ position: 'relative', display: 'flex', gap: '24px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          {/* 좌측 */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.7)', borderRadius: '999px', padding: '5px 16px', boxShadow: '0 1px 3px rgba(176,122,62,.15)' }}>
                {wv.has && (
                  <>
                    <HoverAnchor
                      href={weatherHref}
                      target="_blank"
                      rel="noopener"
                      title={(weather?.city || '현재 위치') + ' 날씨 — 네이버에서 보기'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'opacity .15s' }}
                      hoverStyle={{ opacity: 0.6 }}
                    >
                      <span style={{ display: 'inline-block', fontSize: '16px', animation: wv.anim }}>{wv.emoji}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#8A7357' }}>{wv.temp}</span>
                    </HoverAnchor>
                    <span style={{ width: '1px', height: '13px', background: 'rgba(176,122,62,.25)' }} />
                  </>
                )}
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#B07A3E' }}>{todayLabel}</span>
                <span style={{ width: '1px', height: '13px', background: 'rgba(176,122,62,.25)' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#B07A3E' }}>{clockLabel}</span>
              </span>
              <span style={{ fontFamily: "'Gowun Dodum',serif", fontSize: '25px', lineHeight: 1.3, letterSpacing: '-.01em' }}>
                {greeting}, <span style={{ color: '#7C5CFC' }}>{userName}님</span> <span style={{ fontSize: '16px', color: '#8A7357' }}>— 오늘도 좋은 하루 보내세요.</span>
              </span>
            </div>

            {/* 공지 티커 (게시중 공지가 없어도 항상 표시) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
              <button onClick={() => setNoticeHidden((v) => !v)} title="공지 표시/숨김" style={{ fontFamily: 'inherit', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative', opacity: noticeHidden ? 0.45 : 1, transition: 'opacity .15s', lineHeight: 1 }}>
                📢{noticeHidden && <span style={{ position: 'absolute', left: '50%', top: '50%', width: '20px', height: '2.5px', background: '#B0533B', borderRadius: '2px', transform: 'translate(-50%,-50%) rotate(-45deg)', boxShadow: '0 0 0 1.5px rgba(255,255,255,.7)' }} />}
              </button>
              <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#8A5A2E', flexShrink: 0 }}>공지</span>
              <div onClick={openNotice} title="클릭하면 전체 공지를 볼 수 있어요" style={{ flex: 1, minWidth: 0, overflow: 'hidden', cursor: 'pointer', visibility: noticeHidden ? 'hidden' : 'visible', height: '22px', lineHeight: '22px' }}>
                <div style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '13.5px', fontWeight: 600, color: '#8A7357', animation: 'marquee 45s linear infinite' }}>
                  {noticeParts.map((p, i) => (
                    <span key={i}>
                      <span className={p.cls}>{p.text}</span>
                      <span style={{ opacity: 0.45, padding: '0 10px' }}>·</span>
                    </span>
                  ))}
                </div>
              </div>
              <HoverButton onClick={() => navigate('/notice-admin')} title="공지 관리" style={{ fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 800, color: '#B07A3E', background: 'rgba(255,255,255,.65)', border: 'none', borderRadius: '999px', padding: '4px 12px', cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }} hoverStyle={{ background: 'rgba(255,255,255,.95)' }}>관리 ›</HoverButton>
            </div>

            {/* 메모 */}
            <div style={{ ...glass, flex: 'none', height: '62px', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 16px' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>📝</span>
              <textarea value={memo} onChange={onMemoText} placeholder="잊지 말아야 할 것들을 적어두세요 — 자동 저장돼요" spellCheck={false} style={{ flex: 1, alignSelf: 'stretch', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6, border: 'none', outline: 'none', resize: 'none', color: '#4A4258', background: 'transparent', boxSizing: 'border-box', padding: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                <HoverButton onClick={clearMemo} title="메모 초기화" style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>✕</HoverButton>
                <HoverButton onClick={memoToTodo} title="메모를 TODOLIST 항목으로 저장 (줄마다 하나씩)" style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 800, color: '#7C5CFC', background: 'rgba(239,233,255,.9)', border: 'none', borderRadius: '999px', padding: '3px 10px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ background: '#7C5CFC', color: '#fff' }}>TODO에 추가</HoverButton>
              </div>
            </div>

            {/* 명언 */}
            <div style={{ ...glass, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', minWidth: 0 }}>
              <span style={{ fontFamily: "'Gowun Dodum',serif", fontSize: '20px', lineHeight: 1, color: '#C4AEFF', flexShrink: 0 }}>“</span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "'Gowun Dodum',serif", fontSize: '14.5px', lineHeight: 1.5, color: '#4A4258', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote.text}</span>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#9A8FB8', flexShrink: 0 }}>{quote.author}</span>
            </div>

            {/* 뉴스 */}
            <HoverAnchor href={newsUrl} target="_blank" rel="noopener" style={{ ...glass, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', textDecoration: 'none', minWidth: 0, transition: 'transform .15s ease, box-shadow .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(76,111,255,.16)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', background: '#4C6FFF', padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>IT·AI 뉴스</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '13.5px', fontWeight: 700, color: '#3A4354', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newsTitle}</span>
              <span style={{ fontSize: '11.5px', color: '#98A0B3', flexShrink: 0 }}>{newsCounter} ↗</span>
            </HoverAnchor>
          </div>

          {/* 우측 위젯 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch', justifyContent: 'space-between', marginLeft: 'auto', maxWidth: '100%', width: '520px' }}>
              {/* 미니 캘린더 */}
              <HoverButton onClick={openCal} style={{ fontFamily: 'inherit', textAlign: 'left', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '14px', padding: '11px 16px', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(124,92,252,.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ fontSize: '15px' }}>📅</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#A08B6E' }}>{calTitle}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#B9A88C' }}>크게 보기 ↗</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '24px', gap: '2px', height: '170px' }}>
                  {CAL_DOWS.map((dow) => (
                    <div key={dow.name} style={{ fontSize: '11px', fontWeight: 800, color: dow.ink, textAlign: 'center', lineHeight: '24px' }}>{dow.name}</div>
                  ))}
                  {calCells.map((c) => (
                    <div key={c.key} style={{ fontSize: '12px', fontWeight: c.weight, color: c.ink, background: c.bg, borderRadius: '7px', textAlign: 'center', lineHeight: '24px' }}>{c.day || ''}</div>
                  ))}
                </div>
              </HoverButton>

              {/* 오늘 점심 / 퇴근 / 월급 */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <HoverButton onClick={() => navigate('/meal')} title="이번 주 식단표 보기" style={{ flex: 1, height: '58px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '14px', padding: '8px 15px', backdropFilter: 'blur(4px)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease' }} hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(232,130,58,.18)' }}>
                  <span style={{ fontSize: '19px' }}>🍚</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#A08B6E' }}>오늘 점심</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#5A4A32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heroLunch}</span>
                  </div>
                </HoverButton>
                <div style={{ flex: 1, height: '58px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '14px', padding: '8px 15px', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: '19px' }}>{offEmoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#A08B6E' }}>{offTitle}</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#5A4A32' }}>{offLabel}</span>
                  </div>
                </div>
                <div style={{ flex: 1, height: '58px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)', borderRadius: '14px', padding: '8px 15px', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: '19px' }}>💰</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#A08B6E' }}>월급날까지</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1F8A5B', whiteSpace: 'nowrap' }}>{payLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gridAutoRows: '1fr', gap: '10px', flex: 1 }}>
        {orderedCards.map((c) => (
          <HoverButton
            key={c.key}
            onClick={c.go}
            draggable
            onDragStart={() => { dragCard.current = c.key }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onCardDrop(c.key) }}
            style={{ background: '#fff', borderRadius: '17px', padding: '12px 14px', boxShadow: cardShadow, border: '1px solid #EAEDF5', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '7px', transition: 'transform .2s ease, box-shadow .2s ease' }}
            hoverStyle={{ transform: 'translateY(-4px)', boxShadow: '0 4px 12px ' + c.hs + ', 0 18px 44px rgba(35,43,58,.12)', border: '1px solid ' + c.hb }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '11px', background: c.grad, color: c.ink, display: 'grid', placeItems: 'center', fontSize: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8)' }}>{c.icon}</div>
              {c.badge && (
                <span className={c.badge.blink ? 'notice-blink' : undefined} style={{ fontSize: '12px', fontWeight: c.badge.ink === '#98A0B3' ? 700 : 800, padding: '4px 11px', borderRadius: '999px', background: c.badge.bg, color: c.badge.ink, boxShadow: c.badge.shadow || 'none' }}>{c.badge.text}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-.01em' }}>{c.title}</div>
              <div style={{ fontSize: '12.5px', color: '#737E92' }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: c.ink, display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto' }}>{c.cta} <span>→</span></div>
          </HoverButton>
        ))}
      </div>

      {/* 공지 팝업 */}
      {noticeOpen && (
        <div onClick={() => setNoticeOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(35,43,58,.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'grid', placeItems: 'center', padding: '24px', animation: 'fade .2s ease both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '24px', padding: '26px', boxShadow: '0 24px 64px rgba(35,43,58,.3)', animation: 'fadeUp .3s ease both', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span style={{ fontSize: '18px' }}>📢</span>
              <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-.01em' }}>공지사항</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#B0B7C7' }}>수정하면 자동 저장돼요</span>
            </div>
            <textarea value={editingNotice ? editingNotice.text : ''} onChange={(e) => touchNotice({ text: e.target.value })} spellCheck={false} style={{ fontFamily: 'inherit', fontSize: '14.5px', lineHeight: 1.8, border: '1.5px solid #E7EAF3', borderRadius: '14px', padding: '14px 16px', outline: 'none', resize: 'none', height: '150px', color: '#232B3A', width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>게시 시작</span>
                <input type="date" value={editingNotice ? editingNotice.start || '' : ''} onChange={(e) => touchNotice({ start: e.target.value })} style={{ border: '1.5px solid #E7EAF3', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '13px', padding: '8px 10px', color: '#232B3A' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>종료</span>
                <input type="date" value={editingNotice ? editingNotice.end || '' : ''} onChange={(e) => touchNotice({ end: e.target.value })} style={{ border: '1.5px solid #E7EAF3', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '13px', padding: '8px 10px', color: '#232B3A' }} />
              </div>
              <span style={{ fontSize: '11.5px', color: '#B0B7C7' }}>비우면 항상 게시돼요</span>
            </div>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737E92' }}>스타일</span>
              {NOTICE_STYLE_KEYS.map((k) => {
                const cur = (editingNotice && editingNotice.styleType) || 'plain'
                const label = k === 'plain' ? '기본' : k === 'rainbow' ? '🌈 알록달록' : '✨ 깜빡임'
                return (
                  <button key={k} onClick={() => touchNotice({ styleType: k })} className={clsOf(k)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: cur === k ? 800 : 600, color: cur === k ? '#fff' : '#737E92', background: cur === k ? '#7C5CFC' : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '7px 15px', cursor: 'pointer', transition: 'all .15s' }}>{label}</button>
                )
              })}
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#98A0B3', fontWeight: 600, height: '16px', lineHeight: '16px', overflow: 'hidden' }}>{noticeMetaLabel}</div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button onClick={() => setNoticeOpen(false)} style={{ flex: 1, fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#8B6DFF,#7C5CFC)', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,92,252,.3)' }}>확인</button>
              <HoverButton onClick={resetNotice} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', borderRadius: '12px', padding: '12px 18px', cursor: 'pointer' }} hoverStyle={{ color: '#E05B5B' }}>초기화 후 저장</HoverButton>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 팝업 */}
      {calOpen && (
        <div onClick={() => setCalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(35,43,58,.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'grid', placeItems: 'center', padding: '24px', animation: 'fade .2s ease both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '26px', padding: '28px', boxShadow: '0 24px 64px rgba(35,43,58,.3)', animation: 'fadeUp .3s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <HoverButton onClick={() => moveCal(-1)} style={{ fontFamily: 'inherit', width: '36px', height: '36px', border: 'none', borderRadius: '12px', background: '#F1F3F7', color: '#737E92', fontSize: '16px', fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ background: '#EFE9FF', color: '#7C5CFC' }}>‹</HoverButton>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-.01em' }}>📅 {calTitle}</div>
              <HoverButton onClick={() => moveCal(1)} style={{ fontFamily: 'inherit', width: '36px', height: '36px', border: 'none', borderRadius: '12px', background: '#F1F3F7', color: '#737E92', fontSize: '16px', fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ background: '#EFE9FF', color: '#7C5CFC' }}>›</HoverButton>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '46px', gap: '4px', height: '346px' }}>
              {CAL_DOWS.map((dow) => (
                <div key={dow.name} style={{ fontSize: '12px', fontWeight: 800, color: dow.ink, textAlign: 'center', lineHeight: '46px' }}>{dow.name}</div>
              ))}
              {calCells.map((c) => (
                <div key={c.key} style={{ borderRadius: '11px', textAlign: 'center', background: c.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: c.weight, color: c.ink, lineHeight: 1.2 }}>{c.day || ''}</div>
                  {c.holiday && (
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: c.ink, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{c.holiday}</div>
                  )}
                </div>
              ))}
            </div>
            <HoverButton onClick={() => setCalOpen(false)} style={{ marginTop: '18px', width: '100%', fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#737E92', background: '#F1F3F7', border: 'none', borderRadius: '13px', padding: '12px', cursor: 'pointer', transition: 'all .15s' }} hoverStyle={{ background: '#E7EAF3', color: '#232B3A' }}>닫기</HoverButton>
          </div>
        </div>
      )}
    </section>
  )
}

// 원본 style-hover 를 가진 <a> 링크
function HoverAnchor({ style, hoverStyle, ...rest }) {
  const [hover, setHover] = useState(false)
  return (
    <a {...rest} style={{ ...style, ...(hover && hoverStyle ? hoverStyle : null) }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} />
  )
}

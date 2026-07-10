import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'
import Pager from '../components/Pager'
import useAutoPage from '../hooks/useAutoPage'
import { TODO_CATEGORIES, DEFAULT_CATEGORY, categoryOf } from '../data/todoCategories'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'

export default function Todo() {
  const navigate = useNavigate()
  const { uid } = useAuth()
  const [todos, setTodos] = useLocalStorage(`sd1-portal-todos-${uid}`, [])
  const [todoText, setTodoText] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORY)
  const [filter, setFilter] = useState('all')

  const addTodo = () => {
    const text = todoText.trim()
    if (!text) return
    setTodos([{ id: 't' + Date.now(), text, done: false, ts: Date.now(), category }, ...todos])
    setTodoText('')
  }
  const toggle = (id) => setTodos(todos.map((q) => (q.id === id ? { ...q, done: !q.done } : q)))
  const remove = (id) => setTodos(todos.filter((q) => q.id !== id))
  const clearDone = () => setTodos(todos.filter((t) => !t.done))
  const whenLabel = (ts) => {
    const d = new Date(ts)
    return d.getMonth() + 1 + '/' + d.getDate()
  }

  const remaining = todos.filter((t) => !t.done).length
  const summary = todos.length ? `전체 ${todos.length}개 · 남은 할 일 ${remaining}개` : '첫 할 일을 추가해 보세요'
  const hasDone = todos.some((t) => t.done)

  const catCount = (key) => todos.filter((t) => categoryOf(t.category).key === key).length
  const filtered = filter === 'all' ? todos : todos.filter((t) => categoryOf(t.category).key === filter)
  const filterTabs = [
    { key: 'all', label: '전체', color: '#232B3A', count: todos.length },
    ...TODO_CATEGORIES.map((c) => ({ key: c.key, label: c.icon + ' ' + c.name, color: c.color, count: catCount(c.key) })),
  ]
  const { ref: listRef, pageItems, page, setPage, totalPages } = useAutoPage(filtered, 46, { gap: 9, reserved: 80 })

  return (
    <section data-screen-label="나의 TODOLIST">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#EFE9FF,#E2D7FF)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>✅</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>나의 TODOLIST</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>이 목록은 내 계정에만 저장돼요 · {summary}</p>
        </div>
      </div>

      {/* 입력 + 분류 선택 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="할 일을 입력하고 Enter"
            style={{ flex: 1, minWidth: 0, border: '1.5px solid #E7EAF3', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', fontSize: '14.5px', padding: '12px 15px', color: '#232B3A' }}
          />
          <HoverButton
            onClick={addTodo}
            style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#8B6DFF,#7C5CFC)', border: 'none', borderRadius: '12px', padding: '12px 26px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,92,252,.3)', transition: 'transform .15s ease' }}
            hoverStyle={{ transform: 'translateY(-2px)' }}
          >
            ＋ 추가
          </HoverButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', marginRight: '2px' }}>분류</span>
          {TODO_CATEGORIES.map((c) => {
            const on = category === c.key
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: on ? 800 : 700, color: on ? '#fff' : c.color, background: on ? c.color : c.bg, border: 'none', borderRadius: '999px', padding: '6px 13px', cursor: 'pointer', transition: 'all .15s', boxShadow: on ? '0 4px 12px ' + c.color + '55' : 'none' }}
              >
                {c.icon} {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 분류 필터 탭 */}
      {todos.length > 0 && (
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', margin: '0 2px 14px' }}>
          {filterTabs.map((t) => {
            const on = filter === t.key
            return (
              <button
                key={t.key}
                onClick={() => { setFilter(t.key); setPage(0) }}
                style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: on ? 800 : 600, color: on ? '#fff' : '#737E92', background: on ? t.color : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '7px 14px', cursor: 'pointer', transition: 'all .15s' }}
              >
                {t.label} <span style={{ opacity: 0.75 }}>{t.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 목록 */}
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {pageItems.map((t) => {
          const cat = categoryOf(t.category)
          return (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '15px', padding: '13px 17px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '13px', opacity: t.done ? 0.55 : 1 }}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} style={{ width: '19px', height: '19px', accentColor: cat.color, cursor: 'pointer', margin: 0, flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: cat.color, background: cat.bg, padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>{cat.icon} {cat.name}</span>
              <div style={{ flex: 1, minWidth: 0, fontSize: '14.5px', fontWeight: 600, color: t.done ? '#98A0B3' : '#232B3A', textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</div>
              <span style={{ fontSize: '12px', color: '#B0B7C7', flexShrink: 0 }}>{whenLabel(t.ts)}</span>
              <HoverButton
                onClick={() => remove(t.id)}
                style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#C9CFDC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0, transition: 'color .15s' }}
                hoverStyle={{ color: '#E05B5B' }}
              >
                ✕
              </HoverButton>
            </div>
          )
        })}

        {todos.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>할 일이 없어요. 위에서 추가해 보세요! ✨</div>
        )}
        {todos.length > 0 && filter !== 'all' && filtered.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '32px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>이 분류에는 할 일이 없어요.</div>
        )}
      </div>

      <Pager page={page} totalPages={totalPages} onChange={setPage} accent="#7C5CFC" />

      {hasDone && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <HoverButton
            onClick={clearDone}
            style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'all .15s' }}
            hoverStyle={{ color: '#E05B5B', background: '#FFECEC' }}
          >
            완료된 항목 정리
          </HoverButton>
        </div>
      )}
    </section>
  )
}

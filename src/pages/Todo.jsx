import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'

export default function Todo() {
  const navigate = useNavigate()
  const { uid } = useAuth()
  const [todos, setTodos] = useLocalStorage(`sd1-portal-todos-${uid}`, [])
  const [todoText, setTodoText] = useState('')

  const addTodo = () => {
    const text = todoText.trim()
    if (!text) return
    setTodos([{ id: 't' + Date.now(), text, done: false, ts: Date.now() }, ...todos])
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
  const summary = todos.length
    ? `전체 ${todos.length}개 · 남은 할 일 ${remaining}개`
    : '첫 할 일을 추가해 보세요'
  const hasDone = todos.some((t) => t.done)

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

      {/* 입력 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '20px', padding: '16px 18px', boxShadow: cardShadow, display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
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

      {/* 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {todos.map((t) => (
          <div key={t.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '15px', padding: '13px 17px', boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: '13px', opacity: t.done ? 0.55 : 1 }}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} style={{ width: '19px', height: '19px', accentColor: '#7C5CFC', cursor: 'pointer', margin: 0, flexShrink: 0 }} />
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
        ))}

        {todos.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>할 일이 없어요. 위에서 추가해 보세요! ✨</div>
        )}

        {hasDone && (
          <HoverButton
            onClick={clearDone}
            style={{ alignSelf: 'flex-end', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#98A0B3', background: '#F1F3F7', border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', marginTop: '6px', transition: 'all .15s' }}
            hoverStyle={{ color: '#E05B5B', background: '#FFECEC' }}
          >
            완료된 항목 정리
          </HoverButton>
        )}
      </div>
    </section>
  )
}

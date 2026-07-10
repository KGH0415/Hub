import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import useLocalStorage from '../hooks/useLocalStorage'
import { HoverButton } from '../components/ui'

const cardShadow = '0 1px 2px rgba(35,43,58,.04), 0 8px 24px rgba(35,43,58,.05)'
const PER = 4
const ANIMALS = [['판다', '🐼'], ['너구리', '🦝'], ['펭귄', '🐧'], ['해달', '🦦'], ['부엉이', '🦉'], ['여우', '🦊'], ['고래', '🐋'], ['다람쥐', '🐿️'], ['문어', '🐙'], ['알파카', '🦙']]

const NOW0 = Date.now()
const DEFAULT_POSTS = [
  { id: 'seed2', nick: '익명의 수달', emoji: '🦦', text: '수요일 특식 훈제오리볶음밥 기대됩니다. 11시 반 땡 하면 출발하실 분?', ts: NOW0 - 1000 * 60 * 60 * 3, likes: 4, mine: false },
  { id: 'seed1', nick: '익명의 고슴도치', emoji: '🦔', text: '탕비실 커피 원두 바뀐 거 눈치채신 분... 저만 맛있나요', ts: NOW0 - 1000 * 60 * 60 * 26, likes: 7, mine: false },
]

function makeAnon() {
  const pick = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return { nick: '익명의 ' + pick[0], emoji: pick[1] }
}

function timeLabel(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return m + '분 전'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '시간 전'
  return Math.floor(h / 24) + '일 전'
}

export default function Board() {
  const navigate = useNavigate()
  const notify = useToast()
  const [posts, setPosts] = useLocalStorage('sd1-portal-board', DEFAULT_POSTS)
  const [anon] = useLocalStorage('sd1-portal-anon', makeAnon())
  const [boardText, setBoardText] = useState('')
  const [liked, setLiked] = useState({})
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [page, setPage] = useState(0)
  const [cmtOpen, setCmtOpen] = useState({})
  const [cmtInputs, setCmtInputs] = useState({})
  const [cmtEditId, setCmtEditId] = useState(null)
  const [cmtEditText, setCmtEditText] = useState('')

  const myNick = anon.nick
  const myEmoji = anon.emoji

  const postBoard = () => {
    const text = boardText.trim()
    if (!text) return
    setPosts([{ id: 'p' + Date.now(), nick: anon.nick, emoji: anon.emoji, text, ts: Date.now(), likes: 0, mine: true }, ...posts])
    setBoardText('')
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PER))
  const curPage = Math.min(page, totalPages - 1)
  const rows = posts.slice(curPage * PER, curPage * PER + PER)
  const showPager = posts.length > PER

  const toggleLike = (p) => {
    const isLiked = !!liked[p.id]
    setPosts(posts.map((q) => (q.id === p.id ? { ...q, likes: Math.max(0, q.likes + (isLiked ? -1 : 1)) } : q)))
    setLiked({ ...liked, [p.id]: !isLiked })
  }
  const removePost = (p) => {
    setPosts(posts.filter((q) => q.id !== p.id))
    notify('삭제했어요')
  }
  const savePostEdit = (p) => {
    const text = editText.trim()
    if (!text) return
    setPosts(posts.map((q) => (q.id === p.id ? { ...q, text, edited: true } : q)))
    setEditId(null)
    setEditText('')
  }

  const saveCmts = (p, nextCmts) => setPosts(posts.map((q) => (q.id === p.id ? { ...q, comments: nextCmts } : q)))
  const addCmt = (p, cmts) => {
    const text = (cmtInputs[p.id] || '').trim()
    if (!text) return
    saveCmts(p, [...cmts, { id: 'c' + Date.now(), nick: anon.nick, emoji: anon.emoji, text, ts: Date.now(), mine: true }])
    setCmtInputs({ ...cmtInputs, [p.id]: '' })
  }

  return (
    <section data-screen-label="익명 게시판">
      <HoverButton
        onClick={() => navigate('/')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#737E92', cursor: 'pointer', padding: '8px 4px', marginBottom: '8px', transition: 'color .15s' }}
        hoverStyle={{ color: '#232B3A' }}
      >
        ← 홈으로
      </HoverButton>

      <div style={{ margin: '6px 4px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#E3F5F8,#CDEBF1)', display: 'grid', placeItems: 'center', fontSize: '25px' }}>💬</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em' }}>익명 게시판</h1>
          <p style={{ margin: '3px 0 0', color: '#737E92', fontSize: '14px' }}>누가 썼는지 아무도 몰라요. 매너는 지켜주세요 🙏</p>
        </div>
      </div>

      {/* 글쓰기 */}
      <div style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '16px', padding: '13px 16px', boxShadow: cardShadow, display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span title={myNick + '(으)로 작성돼요'} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E3F5F8', display: 'grid', placeItems: 'center', fontSize: '16px', flexShrink: 0 }}>{myEmoji}</span>
        <textarea
          value={boardText}
          onChange={(e) => setBoardText(e.target.value)}
          rows={2}
          placeholder={'하고 싶은 말을 자유롭게 적어주세요 — ' + myNick + '(으)로 작성돼요'}
          spellCheck={false}
          style={{ flex: 1, fontFamily: 'inherit', fontSize: '13.5px', lineHeight: 1.6, border: '1.5px solid #E7EAF3', borderRadius: '12px', padding: '9px 13px', outline: 'none', resize: 'vertical', color: '#232B3A', boxSizing: 'border-box' }}
        />
        <HoverButton onClick={postBoard} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#4FBACB,#3AA6B9)', border: 'none', borderRadius: '11px', padding: '9px 20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(58,166,185,.3)', transition: 'transform .15s ease', alignSelf: 'center' }} hoverStyle={{ transform: 'translateY(-2px)' }}>올리기</HoverButton>
      </div>

      {/* 글 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {rows.map((p) => {
          const cmts = Array.isArray(p.comments) ? p.comments : []
          const open = !!cmtOpen[p.id]
          const isEditing = editId === p.id
          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #EAEDF5', borderRadius: '15px', padding: '11px 16px', boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ width: '27px', height: '27px', borderRadius: '50%', background: '#F1F3F7', display: 'grid', placeItems: 'center', fontSize: '14px', flexShrink: 0 }}>{p.emoji}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#4A5468' }}>{p.nick}</span>
                <span style={{ fontSize: '11.5px', color: '#B0B7C7' }}>{timeLabel(p.ts)}</span>
                <div style={{ flex: 1 }} />
                {p.mine && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <HoverButton onClick={() => { setEditId(p.id); setEditText(p.text) }} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', transition: 'color .15s' }} hoverStyle={{ color: '#3AA6B9' }}>수정</HoverButton>
                    <HoverButton onClick={() => removePost(p)} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>삭제</HoverButton>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} spellCheck={false} style={{ fontFamily: 'inherit', fontSize: '14.5px', lineHeight: 1.7, border: '1.5px solid #BCE4EC', borderRadius: '13px', padding: '12px 15px', outline: 'none', resize: 'vertical', color: '#232B3A', width: '100%', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => savePostEdit(p)} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, color: '#fff', background: '#3AA6B9', border: 'none', borderRadius: '10px', padding: '8px 20px', cursor: 'pointer' }}>저장</button>
                    <button onClick={() => { setEditId(null); setEditText('') }} style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: '#737E92', background: '#F1F3F7', border: 'none', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer' }}>취소</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#232B3A', whiteSpace: 'pre-wrap', paddingLeft: '36px' }}>
                  {p.text}
                  {p.edited && <span style={{ fontSize: '11px', color: '#B0B7C7', fontWeight: 600 }}> (수정됨)</span>}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingLeft: '36px' }}>
                <HoverButton onClick={() => toggleLike(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 800, color: liked[p.id] ? '#fff' : '#3AA6B9', background: liked[p.id] ? '#3AA6B9' : '#E3F5F8', border: 'none', borderRadius: '999px', padding: '4px 11px', cursor: 'pointer', transition: 'all .15s ease' }} hoverStyle={{ transform: 'scale(1.05)' }}>👍 공감 {p.likes}</HoverButton>
                <HoverButton onClick={() => setCmtOpen({ ...cmtOpen, [p.id]: !open })} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 800, color: open ? '#fff' : '#737E92', background: open ? '#3AA6B9' : '#F1F3F7', border: 'none', borderRadius: '999px', padding: '4px 11px', cursor: 'pointer', transition: 'all .15s ease' }} hoverStyle={{ transform: 'scale(1.05)' }}>💬 댓글 {cmts.length}</HoverButton>
              </div>

              {/* 댓글 */}
              {open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #EFF2F8', paddingTop: '9px', marginLeft: '36px' }}>
                  {cmts.map((c) => {
                    const cEditing = cmtEditId === c.id
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', background: '#F8FAFC', borderRadius: '12px', padding: '9px 13px' }}>
                        <span style={{ fontSize: '15px', flexShrink: 0, lineHeight: 1.5 }}>{c.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#4A5468' }}>{c.nick}</span>
                            <span style={{ fontSize: '11px', color: '#B0B7C7' }}>{timeLabel(c.ts)}</span>
                            <div style={{ flex: 1 }} />
                            {c.mine && (
                              <>
                                <HoverButton onClick={() => { setCmtEditId(c.id); setCmtEditText(c.text) }} style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 700, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', transition: 'color .15s' }} hoverStyle={{ color: '#3AA6B9' }}>수정</HoverButton>
                                <HoverButton onClick={() => saveCmts(p, cmts.filter((q) => q.id !== c.id))} style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 700, color: '#B0B7C7', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', transition: 'color .15s' }} hoverStyle={{ color: '#E05B5B' }}>삭제</HoverButton>
                              </>
                            )}
                          </div>
                          {cEditing ? (
                            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                              <input
                                value={cmtEditText}
                                onChange={(e) => setCmtEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const t = cmtEditText.trim()
                                    if (t) { saveCmts(p, cmts.map((q) => (q.id === c.id ? { ...q, text: t, edited: true } : q))); setCmtEditId(null); setCmtEditText('') }
                                  }
                                }}
                                style={{ flex: 1, minWidth: 0, border: '1.5px solid #BCE4EC', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', fontSize: '13px', padding: '7px 11px', color: '#232B3A', background: '#fff' }}
                              />
                              <button onClick={() => { const t = cmtEditText.trim(); if (!t) return; saveCmts(p, cmts.map((q) => (q.id === c.id ? { ...q, text: t, edited: true } : q))); setCmtEditId(null); setCmtEditText('') }} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, color: '#fff', background: '#3AA6B9', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' }}>저장</button>
                              <button onClick={() => { setCmtEditId(null); setCmtEditText('') }} style={{ fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#737E92', background: '#EDEFF6', border: 'none', borderRadius: '8px', padding: '7px 11px', cursor: 'pointer' }}>취소</button>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#3A4354', whiteSpace: 'pre-wrap' }}>
                              {c.text}
                              {c.edited && <span style={{ fontSize: '10.5px', color: '#B0B7C7', fontWeight: 600 }}> (수정됨)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{myEmoji}</span>
                    <input
                      value={cmtInputs[p.id] || ''}
                      onChange={(e) => setCmtInputs({ ...cmtInputs, [p.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addCmt(p, cmts)}
                      placeholder="익명 댓글 달기"
                      style={{ flex: 1, minWidth: 0, border: '1.5px solid #E7EAF3', borderRadius: '11px', outline: 'none', fontFamily: 'inherit', fontSize: '13px', padding: '8px 13px', color: '#232B3A', background: '#fff' }}
                    />
                    <HoverButton onClick={() => addCmt(p, cmts)} style={{ fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: '#3AA6B9', background: '#E3F5F8', border: 'none', borderRadius: '11px', padding: '8px 16px', cursor: 'pointer', transition: 'transform .15s' }} hoverStyle={{ transform: 'scale(1.04)' }}>등록</HoverButton>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {posts.length === 0 && (
          <div style={{ border: '2px dashed #DDE2EE', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#A6ADC0', fontSize: '14px', fontWeight: 600 }}>아직 글이 없어요. 첫 글을 남겨보세요!</div>
        )}
      </div>

      {showPager && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '18px' }}>
          <HoverButton onClick={() => setPage(Math.max(0, curPage - 1))} disabled={curPage === 0} style={{ fontFamily: 'inherit', width: '38px', height: '38px', border: '1px solid #EAEDF5', borderRadius: '12px', background: '#fff', color: curPage === 0 ? '#D5DAE6' : '#3AA6B9', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(35,43,58,.05)', transition: 'all .15s' }} hoverStyle={{ border: '1px solid #BCE4EC' }}>‹</HoverButton>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#737E92', minWidth: '44px', textAlign: 'center' }}>{curPage + 1} / {totalPages}</span>
          <HoverButton onClick={() => setPage(Math.min(totalPages - 1, curPage + 1))} disabled={curPage >= totalPages - 1} style={{ fontFamily: 'inherit', width: '38px', height: '38px', border: '1px solid #EAEDF5', borderRadius: '12px', background: '#fff', color: curPage >= totalPages - 1 ? '#D5DAE6' : '#3AA6B9', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(35,43,58,.05)', transition: 'all .15s' }} hoverStyle={{ border: '1px solid #BCE4EC' }}>›</HoverButton>
        </div>
      )}
    </section>
  )
}

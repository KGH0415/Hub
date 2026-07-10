import { HoverButton } from './ui'

// 번호형 페이지네이션 (‹ 1 2 3 ›). totalPages<=1이면 렌더 안 함.
export default function Pager({ page, totalPages, onChange, accent = '#7C5CFC' }) {
  if (totalPages <= 1) return null

  const arrow = (label, disabled, to) => (
    <HoverButton
      onClick={() => !disabled && onChange(to)}
      disabled={disabled}
      style={{ fontFamily: 'inherit', width: '34px', height: '34px', border: '1px solid #EAEDF5', borderRadius: '10px', background: '#fff', color: disabled ? '#D5DAE6' : accent, fontSize: '16px', fontWeight: 800, cursor: disabled ? 'default' : 'pointer', transition: 'all .15s' }}
      hoverStyle={disabled ? {} : { border: '1px solid ' + accent + '66' }}
    >
      {label}
    </HoverButton>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', flexWrap: 'wrap' }}>
      {arrow('‹', page === 0, page - 1)}
      {Array.from({ length: totalPages }, (_, i) => {
        const on = i === page
        return (
          <HoverButton
            key={i}
            onClick={() => onChange(i)}
            style={{ fontFamily: 'inherit', minWidth: '34px', height: '34px', padding: '0 8px', border: '1px solid ' + (on ? accent : '#EAEDF5'), borderRadius: '10px', background: on ? accent : '#fff', color: on ? '#fff' : '#737E92', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }}
            hoverStyle={on ? {} : { border: '1px solid ' + accent + '66', color: accent }}
          >
            {i + 1}
          </HoverButton>
        )
      })}
      {arrow('›', page >= totalPages - 1, page + 1)}
    </div>
  )
}

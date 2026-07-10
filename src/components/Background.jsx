// 잔잔한 배경 애니메이션 레이어 (원본 라인 73-81 이식)
const blob = (extra) => ({
  position: 'absolute',
  borderRadius: '50%',
  ...extra,
})

export default function Background() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'hueShift 14s ease-in-out infinite',
      }}
    >
      <div style={blob({ left: '-120px', top: '-100px', width: '560px', height: '560px', background: 'radial-gradient(circle at 40% 40%, rgba(255,164,96,.42), rgba(255,164,96,0) 70%)', filter: 'blur(26px)', animation: 'drift1 6s ease-in-out infinite' })} />
      <div style={blob({ right: '-140px', top: '12%', width: '620px', height: '620px', background: 'radial-gradient(circle at 55% 45%, rgba(124,92,252,.34), rgba(124,92,252,0) 70%)', filter: 'blur(30px)', animation: 'drift2 7.5s ease-in-out infinite' })} />
      <div style={blob({ left: '20%', bottom: '-200px', width: '640px', height: '640px', background: 'radial-gradient(circle at 50% 40%, rgba(47,163,107,.3), rgba(47,163,107,0) 70%)', filter: 'blur(32px)', animation: 'drift3 9s ease-in-out infinite' })} />
      <div style={blob({ right: '24%', top: '-160px', width: '460px', height: '460px', background: 'radial-gradient(circle at 45% 50%, rgba(245,110,170,.32), rgba(245,110,170,0) 70%)', filter: 'blur(24px)', animation: 'drift3 7s ease-in-out infinite reverse' })} />
      <div style={blob({ left: '40%', top: '34%', width: '420px', height: '420px', background: 'radial-gradient(circle at 50% 50%, rgba(76,111,255,.22), rgba(76,111,255,0) 70%)', filter: 'blur(30px)', animation: 'drift1 8s ease-in-out infinite reverse' })} />
      <div style={blob({ left: '-80px', bottom: '6%', width: '420px', height: '420px', background: 'radial-gradient(circle at 50% 50%, rgba(255,201,64,.26), rgba(255,201,64,0) 70%)', filter: 'blur(26px)', animation: 'drift2 10s ease-in-out infinite reverse' })} />
    </div>
  )
}

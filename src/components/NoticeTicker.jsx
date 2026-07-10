const DEFAULT_NOTICES = [
  '📢 7월 정기 회식은 금요일 저녁 7시입니다.',
  '🛠 GitLab 서버 점검: 토요일 02:00 ~ 04:00',
  '🍩 이번 주 간식 신청은 수요일까지!',
]

export default function NoticeTicker({ notices = DEFAULT_NOTICES }) {
  const text = notices.join('        •        ')
  return (
    <div className="notice-ticker">
      <span className="ticker-label">공지</span>
      <div className="ticker-viewport">
        <div className="ticker-track">{text}</div>
      </div>
    </div>
  )
}

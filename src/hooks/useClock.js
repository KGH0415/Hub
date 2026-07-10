import { useState, useEffect } from 'react'

/**
 * 일정 간격으로 리렌더를 유발해 시계/카운트다운 표시를 갱신한다.
 * (원본 componentDidMount의 this._clock = setInterval(forceUpdate, 30000) 대체)
 */
export default function useClock(intervalMs = 30000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

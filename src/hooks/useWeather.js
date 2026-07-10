import { useState, useEffect } from 'react'

// 현재 위치(Geolocation)를 자동 감지해 그 좌표의 현재 날씨를 불러온다.
// 권한 거부·미지원·실패 시 창원 좌표로 폴백. API 키 불필요(Open-Meteo).
const FALLBACK = { lat: 35.228, lon: 128.681, city: '창원' }
const forecastUrl = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul`

export default function useWeather() {
  // { temp, code, city } — city는 네이버 날씨 링크/툴팁에 사용
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    let alive = true

    // 부분 업데이트를 병합(temp/code와 city가 각각 다른 시점에 도착해도 서로 덮어쓰지 않음)
    const merge = (patch) => setWeather((w) => ({ ...(w || {}), ...patch }))

    const loadForecast = (lat, lon) => {
      fetch(forecastUrl(lat, lon))
        .then((r) => r.json())
        .then((data) => {
          const c = data && data.current
          if (alive && c) merge({ temp: Math.round(c.temperature_2m), code: c.weather_code })
        })
        .catch(() => {})
    }

    const loadFallback = () => {
      loadForecast(FALLBACK.lat, FALLBACK.lon)
      if (alive) merge({ city: FALLBACK.city })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          loadForecast(latitude, longitude)
          // 좌표 → 지역명 역지오코딩 (키 불필요, 클라이언트 전용 엔드포인트)
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`)
            .then((r) => r.json())
            .then((d) => {
              const city = d.city || d.locality || d.principalSubdivision || ''
              if (alive && city) merge({ city })
            })
            .catch(() => {})
        },
        () => loadFallback(),
        { timeout: 8000, maximumAge: 10 * 60 * 1000 }
      )
    } else {
      loadFallback()
    }

    return () => {
      alive = false
    }
  }, [])

  return weather
}

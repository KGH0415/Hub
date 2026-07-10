import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * localStorage에 상태를 동기화하는 훅.
 * useState와 동일한 API에 세 번째로 remove 함수를 반환한다.
 *
 * @param key           localStorage 키
 * @param initialValue  저장된 값이 없을 때 사용할 초기값
 * @param opts.raw      true면 JSON 직렬화 없이 문자열 그대로 저장/로드 (원본의 dark, session, memo 등)
 */
export default function useLocalStorage(key, initialValue, { raw = false } = {}) {
  const readValue = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return initialValue
      return raw ? stored : JSON.parse(stored)
    } catch {
      return initialValue
    }
    // initialValue는 매 렌더 새 참조일 수 있어 의도적으로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, raw])

  const [value, setValue] = useState(readValue)

  // key가 바뀌면(예: 사용자별 키 uid 변경) 새 키의 값으로 다시 읽는다.
  const prevKey = useRef(key)
  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key
      setValue(readValue())
    }
  }, [key, readValue])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, raw ? String(value) : JSON.stringify(value))
    } catch {
      /* 저장 공간 초과 등은 무시 */
    }
  }, [key, value, raw])

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* 무시 */
    }
  }, [key])

  return [value, setValue, remove]
}

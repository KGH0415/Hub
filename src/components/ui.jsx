import { useState } from 'react'

/**
 * 원본의 style-hover / style-focus 를 재현하기 위한 헬퍼들.
 * base style 위에 hover/focus 시 추가 style을 얕게 머지한다.
 * React는 인라인으로 :hover를 못 하므로 마우스/포커스 이벤트로 처리.
 */
export function HoverButton({ style, hoverStyle, focusStyle, ...rest }) {
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const merged = {
    ...style,
    ...(hover && hoverStyle ? hoverStyle : null),
    ...(focus && focusStyle ? focusStyle : null),
  }
  return (
    <button
      {...rest}
      style={merged}
      onMouseEnter={(e) => {
        setHover(true)
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setHover(false)
        rest.onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        setFocus(true)
        rest.onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocus(false)
        rest.onBlur?.(e)
      }}
    />
  )
}

export function HoverDiv({ style, hoverStyle, ...rest }) {
  const [hover, setHover] = useState(false)
  const merged = { ...style, ...(hover && hoverStyle ? hoverStyle : null) }
  return (
    <div
      {...rest}
      style={merged}
      onMouseEnter={(e) => {
        setHover(true)
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setHover(false)
        rest.onMouseLeave?.(e)
      }}
    />
  )
}

export function HoverInput({ style, focusStyle, ...rest }) {
  const [focus, setFocus] = useState(false)
  const merged = { ...style, ...(focus && focusStyle ? focusStyle : null) }
  return (
    <input
      {...rest}
      style={merged}
      onFocus={(e) => {
        setFocus(true)
        rest.onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocus(false)
        rest.onBlur?.(e)
      }}
    />
  )
}

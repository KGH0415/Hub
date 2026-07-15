# 신규 메뉴 추가 매뉴얼 (sd1-portal)

이 문서는 포털에 **새 메뉴(페이지)를 추가**하는 표준 절차다. 순서대로 따르면 사이드바에 항목이 생기고, 클릭 시 새 페이지로 이동한다.

관련 에이전트 팀: `menu-manager`(총괄) · `menu-ideator`(기획) · `menu-analyst`(현황 파악) · `menu-developer`(구현) · `menu-tester`(검증) · `dark-mode-checker`(다크모드 점검).

---

## 0. 사전 결정 (menu-ideator / menu-manager)

- **key**: 영소문자 식별자 (예: `notice`, `lunchvote`). 기존 `NAV_ITEMS`의 key와 겹치면 안 된다.
- **route**: URL 경로 (예: `/notice`). 외부 링크면 route 대신 `ext: true`.
- **name / icon**: 사이드바 표시 이름과 이모지.
- **color / bg**: 강조색과 연한 배경색 (활성 상태·헤더에 쓰임). 기존 항목들의 색 감각에 맞춘다.

---

## 1. 페이지 컴포넌트 생성 (menu-developer)

`src/pages/<PascalCase>.jsx` 생성. 기존 페이지(`src/pages/Todo.jsx`)를 골격 참고용으로 삼는다.

관례:
- 인라인 `style={{...}}` 객체로만 스타일링. 새 CSS 클래스/라이브러리 도입 금지.
- 최상단은 `<section data-screen-label="메뉴이름">`.
- "← 홈으로" 버튼(`HoverButton`, `navigate('/')`) + 아이콘 헤더.
- 사용자별 저장이 필요하면 `useLocalStorage(`sd1-portal-<key>-${uid}`, 기본값)`, `uid`는 `useAuth()`.
- 목록형이면 `useAutoPage` + `Pager` 재사용.
- 공유 데이터는 `src/data/`에 둔다.

```jsx
import { useNavigate } from 'react-router-dom'
import { HoverButton } from '../components/ui'

export default function MyMenu() {
  const navigate = useNavigate()
  return (
    <section data-screen-label="새 메뉴">
      <HoverButton onClick={() => navigate('/')} style={{ /* ...Todo.jsx 참고... */ }}>
        ← 홈으로
      </HoverButton>
      {/* 헤더 + 내용 */}
    </section>
  )
}
```

---

## 2. 라우트 등록 (menu-developer)

`src/App.jsx`:
1. 상단에 `import MyMenu from './pages/MyMenu'`.
2. `<Routes>` 안에 `<Route path="/mymenu" element={<MyMenu />} />` 추가 (`*` 폴백 라우트보다 위에).

---

## 3. 사이드바 항목 추가 (menu-developer)

`src/components/Sidebar.jsx`의 `NAV_ITEMS` 배열에 추가:

```js
{ key: 'mymenu', route: '/mymenu', name: '새 메뉴', icon: '🆕', color: '#7C5CFC', bg: '#EFE9FF' },
```

- **외부 링크**라면 `route` 대신 `ext: true`를 쓰고, 이동 동작은 같은 파일 `handleGo` 함수에 분기를 추가한다(현재 wakbu/wiki/meta 처리 방식 참고).

---

## 4. 다크모드 대응 (menu-developer → dark-mode-checker)

새 페이지에서 쓴 인라인 색상값 중 다크모드에서 바뀌어야 하는 것들은 `src/index.css`의 `html[data-dark] [style*="..."]` 규칙에 대응 항목을 추가한다.

- 매칭은 **브라우저 직렬화 형태**로 한다: `color: rgb(35, 43, 58)` (쉼표 뒤 공백).
- 기존 규칙에 이미 있는 색(예: 본문색 `rgb(35, 43, 58)`, 카드 배경 `rgb(255, 255, 255)`, 테두리 `rgb(234, 237, 245)`)을 재사용하면 별도 추가가 거의 필요 없다.
- 작업 후 `dark-mode-checker` 에이전트로 누락을 점검한다.

---

## 5. 검증 (menu-tester)

- `npm run build`로 빌드 오류 없는지 확인.
- 사이드바에 항목이 뜨고, 클릭 시 새 라우트로 이동하는지.
- 다크모드 토글 시 색이 깨지지 않는지.
- 저장 기능이 있으면 새로고침 후에도 값이 유지되는지(localStorage).

---

## 표준 진행 순서 (팀 위임)

```
menu-ideator  → 무엇을 만들지 아이디어·범위 확정
menu-analyst  → 유사 기존 메뉴 구조 파악, 재사용 지점 정리
menu-developer→ 1~4단계 구현
dark-mode-checker → 다크모드 누락 점검
menu-tester   → 5단계 검증
menu-manager  → 전체 계획 수립 및 결과 정리 (진행 내내 총괄)
```

> 참고: 서브에이전트는 서로를 직접 호출하지 못한다. 위 순서는 메인 Claude(또는 사용자)가 각 단계에서 해당 에이전트에게 위임하는 흐름이다.

## 체크리스트

- [ ] `NAV_ITEMS`에 항목 추가 (key 중복 없음)
- [ ] `src/pages/`에 페이지 생성
- [ ] `src/App.jsx`에 import + `<Route>`
- [ ] (외부 링크면) `handleGo` 분기 추가
- [ ] 다크모드 CSS 대응 + `dark-mode-checker` 통과
- [ ] `npm run build` 통과

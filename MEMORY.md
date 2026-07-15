# MEMORY.md

이 프로젝트에서 내린 중요한 결정과 그 이유를 기록한다.
새 항목은 맨 위에 추가한다. 각 항목은 **날짜 · 결정 · 이유** 순으로 남긴다.

<!-- 형식 예시
## YYYY-MM-DD — 한 줄 제목
- **결정:** 무엇을 하기로 했는지
- **이유:** 왜 그렇게 했는지
- **영향:** 어떤 파일·기능에 영향이 있는지 (선택)
-->

## 2026-07-15 — 메뉴 작업용 서브에이전트 5인 팀 + 신규메뉴 매뉴얼
- **결정:** 전 메뉴를 담당하는 에이전트 팀을 `.claude/agents/`에 구성. `menu-manager`(바지사장·총괄, opus), `menu-analyst`(도메인 분석가, sonnet, 읽기전용), `menu-developer`(개발자, opus), `menu-tester`(테스터, haiku), `menu-ideator`(기획, sonnet). 신규 메뉴 추가 절차는 `.claude/docs/new-menu-guide.md`에 문서화.
- **이유:** 메뉴별 작업을 역할별로 나눠 위임하고, 신규 메뉴 추가 시 표준 절차를 따르기 위함. 모델은 역할별 차등(계획·구현=opus, 분석·기획=sonnet, 검증=haiku).
- **영향:** `.claude/agents/menu-*.md`, `.claude/docs/new-menu-guide.md`. 단, 서브에이전트는 서로를 직접 호출하지 못하므로 오케스트레이션은 메인 Claude가 수행.

## 2026-07-15 — 좌측 메뉴 스크롤바 숨김 + 간격 축소
- **결정:** `Sidebar.jsx` 메뉴(`nav`)의 스크롤바를 시각적으로 숨기고(`scrollbar-width:none` + `index.css`의 `.sidebar-nav::-webkit-scrollbar`), 항목 `gap`·`padding`을 줄여 15개 메뉴가 한 화면에 들어오도록 조정.
- **이유:** 메뉴가 많아 세로로 넘칠 때 스크롤바가 보이는 것을 원치 않음. 다만 짧은 화면에서도 접근성을 위해 `overflowY:'auto'`는 유지해 휠·드래그 스크롤은 가능하게 둠.
- **영향:** `src/components/Sidebar.jsx`, `src/index.css`.

## (프로젝트 기준선) — 인라인 스타일 + data-dark 다크모드
- **결정:** 스타일은 인라인 `style={{...}}}`로, 다크모드는 `html[data-dark] [style*="rgb(...)"]` 속성 선택자 오버라이드로 처리한다. (원본 포털 이식 방식 유지)
- **이유:** 원본 HTML/JS 포털의 구조를 그대로 옮기기 위함.
- **영향:** 인라인 색상/테두리/배경을 바꾸면 `index.css`에 대응하는 다크모드 규칙을 함께 추가해야 한다. 자세한 내용은 `CLAUDE.md` 참고.

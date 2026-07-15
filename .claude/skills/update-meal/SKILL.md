---
name: update-meal
description: 주간 식단표(meal.json)를 갱신할 때 사용한다. "식단 업데이트", "meal.json 갱신", "이번 주 식단 반영", "식단표 새로 읽어와" 같은 요청에 트리거. OneDrive의 CTR 주간 메뉴 PPTX를 읽어 src/data/meal.json을 다시 만든다.
---

# 주간 식단표 갱신

`src/data/meal.json`은 손으로 편집하지 않는다. OneDrive에 동기화된 CTR 주간 메뉴 PPTX를 읽어 자동 생성한다. 이 절차는 매주 월요일 예약 작업으로도 돌지만, 수동으로 다시 돌리고 싶을 때 이 스킬을 쓴다.

## 실행

저장소 루트에서 PowerShell로 실행한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-meal.ps1
```

특정 PPTX를 강제로 쓰려면 경로를 넘긴다(자동 탐지를 건너뜀):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-meal.ps1 -PptxPath "C:\경로\메뉴.pptx"
```

## 스크립트가 하는 일 (참고)

1. `~/CTR` 아래에서 파일명에 "빌딩"이 들어간 최신 `*.pptx`를 찾는다.
2. 압축을 풀어 슬라이드별로 가장 큰 이미지(촬영된 메뉴판)를 뽑고, 4방향 회전본을 만든다.
3. 헤드리스 `claude -p`(`~/.local/bin/claude.exe`)에 `scripts/meal-update-prompt.md`를 STDIN(UTF-8)으로 넣어 OCR → `src/data/meal.json` 재작성.
4. `meal.json`을 검증(weekRangeLabel·cafeterias·days 개수 로그)하고 `npm run build`로 반영한다.

## 실행 후 확인

- `scripts/meal-update.log` 마지막 줄에 `meal.json OK: weekRangeLabel=... days=...`가 찍혔는지 본다.
- `src/data/meal.json`의 `weekRangeLabel`이 이번 주 범위인지, `cafeterias[].week`가 5일치인지 확인한다.
- 자세한 데이터 소비 방식은 `src/pages/Meal.jsx` 참고.

## 주의

- 스크립트 본문은 CP949 Windows 대비 ASCII 전용이다. 한글 지침은 `scripts/meal-update-prompt.md`(UTF-8)에만 둔다. — 자세한 함정은 `ERRORS.md` 참고.
- 작업 산출물(`scripts/.meal-work/`)과 로그는 git-ignore 대상이다.

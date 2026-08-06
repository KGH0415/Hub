---
name: update-meal
description: 주간 식단표(meal.json)를 갱신할 때 사용한다. "식단 업데이트", "meal.json 갱신", "이번 주 식단 반영", "식단표 새로 읽어와" 같은 요청에 트리거. OneDrive에 동기화된 SharePoint(CTR NEWS / 주간 식단표) CTR빌딩 PPTX를 읽어 src/data/meal.json을 다시 만든다.
---

# 주간 식단표 갱신

`src/data/meal.json`은 손으로 편집하지 않는다. SharePoint `CTR NEWS > 주간 식단표` 라이브러리(로컬 OneDrive 바로가기로 동기화됨)의 `CTR빌딩 주간식단표.pptx`를 읽어 자동 생성한다.

이 절차는 **매주 월요일 11:55 예약 작업**(`CTR-WeeklyMeal-Update`, Windows 작업 스케줄러)으로 자동 실행되어 meal.json 갱신 후 커밋·push까지 한다. 수동으로 다시 돌리고 싶을 때 이 스킬을 쓴다.

## 소스 위치 / 사전 조건

- 소스: `%USERPROFILE%\OneDrive - CTR\CTR NEWS - 🍙 주간 식단표\CTR빌딩 주간식단표.pptx`
- 이 폴더는 SharePoint 라이브러리 `https://ctrcentral.sharepoint.com/sites/CTR-News/DocLib1`(주간 식단표)를 **"OneDrive에 바로 가기 추가"**로 동기화한 것이다. 바로가기가 사라지면 다시 추가해야 한다.
- 스크립트는 `OneDrive - CTR` 바로 아래 하위 폴더들에서 이름에 "빌딩"이 든 `*.pptx`를 자동 탐지하므로, 라이브러리 폴더 이름(이모지 포함)이 바뀌어도 동작한다.

## 실행

저장소 루트에서 PowerShell로 실행한다. (기본: 갱신 후 자동 커밋·push)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-meal.ps1
```

push 없이 meal.json 갱신·빌드만 검증하려면:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-meal.ps1 -SkipPush
```

특정 PPTX를 강제로 쓰려면 경로를 넘긴다(자동 탐지를 건너뜀):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-meal.ps1 -PptxPath "C:\경로\메뉴.pptx"
```

## 스크립트가 하는 일 (참고)

1. `OneDrive - CTR` 하위에서 파일명에 "빌딩"이 든 최신 `*.pptx`를 찾는다.
2. 압축을 풀어 슬라이드별로 가장 큰 이미지(촬영된 메뉴판)를 뽑고, 4방향 회전본을 만든다.
3. 헤드리스 `claude -p`(`~/.local/bin/claude.exe`)에 `scripts/meal-update-prompt.md`를 STDIN(UTF-8)으로 넣어 OCR → `src/data/meal.json` 재작성.
4. `meal.json`을 검증(weekRangeLabel·cafeterias·days 개수 로그)하고 `npm run build`로 반영한다.
5. `-SkipPush`가 없으면(예약 실행 기본값) 현재 브랜치가 `main`인지 확인 후 `src/data/meal.json`만 커밋하고 `origin main`으로 push한다. GitHub Actions가 빌드·배포한다. 변경이 없으면 커밋·push를 건너뛴다.

## 실행 후 확인

- `scripts/meal-update.log` 마지막 줄에 `meal.json OK: weekRangeLabel=... days=...`가 찍혔는지 본다.
- `src/data/meal.json`의 `weekRangeLabel`이 이번 주 범위인지, `cafeterias[].week`가 5일치인지 확인한다.
- 자세한 데이터 소비 방식은 `src/pages/Meal.jsx` 참고.

## 주의

- 스크립트 본문은 CP949 Windows 대비 ASCII 전용이다. 한글 지침은 `scripts/meal-update-prompt.md`(UTF-8)에만 둔다. — 자세한 함정은 `ERRORS.md` 참고.
- 작업 산출물(`scripts/.meal-work/`)과 로그는 git-ignore 대상이다.

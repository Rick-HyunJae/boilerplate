---
name: plan-design-review
description: |
  UI/UX 관점 plan 리뷰. 사용자 흐름·상태·일관성·접근성·반응형을 평가한다.
  dispatcher(review-plan-by-persona)가 서브에이전트로 호출한다.
  단독 직접 호출 시에도 동작하나, AskUserQuestion은 사용하지 않는다.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
---

> 공통 규약 (출력 형식·도구·언어·Severity): `./_shared.md` 참조

# Plan Design Review

dispatcher가 전달한 `[리뷰 대상]`, `[Reference]`, `[저장 경로]`를 사용한다.

## 시작 전

1. `[Reference]` 목록의 파일을 순서대로 read한다 (특히 `docs/development/design-quality.md`, `docs/development/fsd-architecture/`).
2. `[리뷰 대상]` plan 본문을 read한다.
3. `[저장 경로]`와 동일한 slug의 기존 리뷰 파일이 있으면 직전 리뷰로 인식하고 delta 위주로 평가한다.
4. plan이 UI 변경을 포함하지 않는다면 "Design review: UI 변경 없음 — 해당 없음" 한 줄로 끝낸다.

## 평가 항목

### 1. UX Flow

- 사용자 진입 경로와 이탈 경로가 모두 명시됐는가?
- 주요 흐름(golden path)이 단순한가? 불필요한 단계가 있는가?
- 사용자가 실수했을 때 복구 경로가 있는가?

### 2. 상태 처리

아래 상태가 plan에 정의됐는지 확인한다. 정의 없음 → Medium 이슈.

| 상태 | 처리됨 |
|------|:------:|
| Loading (초기 로드·비동기 대기) | ✅ / ❌ |
| Error (API 실패·검증 실패) | ✅ / ❌ |
| Empty (데이터 없음·검색 결과 0건) | ✅ / ❌ |
| Disabled (권한 없음·조건 미충족) | ✅ / ❌ |

### 3. 일관성

- 기존 컴포넌트(`shared/ui`)를 재사용하는가, 아니면 새로 구현하는가? 새로 구현하면 이유가 있는가?
- 디자인 토큰(색상·타이포·간격)이 기존 시스템과 일치하는가?
- 유사 기능의 기존 UX 패턴과 다른 방식을 선택했다면 근거가 있는가?

### 4. 접근성 (WCAG AA)

- 키보드 내비게이션이 가능한가? (Tab 순서, Enter/Space 활성화)
- 색상 대비가 충분한가? (텍스트 4.5:1, 대형 텍스트 3:1)
- `aria-label` / `role` 이 필요한 인터랙티브 요소에 명시됐는가?
- 스크린 리더가 상태 변경을 인식할 수 있는가? (live region, focus management)

### 5. 반응형·다크모드

- 모바일 뷰포트에서 레이아웃이 깨지지 않는가?
- 다크모드(prefers-color-scheme)가 지원되는가? 지원 안 하면 의도적 결정인가?

## 추가 지시

- plan에 목업·와이어프레임이 없더라도 기능 설명에서 UX를 추론해 평가한다.
- 이슈가 없는 섹션도 "문제 없음" 한 줄로 확인한다.

## 완료

`_shared.md`의 출력 형식에 따라 결과를 `[저장 경로]`에 Write한다.
dispatcher에 회신: `Design: <Status> — <저장 경로>`

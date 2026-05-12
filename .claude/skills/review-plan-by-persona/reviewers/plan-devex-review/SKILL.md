---
name: plan-devex-review
description: |
  개발자 경험(DevEx) 관점 plan 리뷰. API 설계·문서·학습 곡선·디버깅성·마이그레이션을 평가한다.
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

# Plan DevEx Review

dispatcher가 전달한 `[리뷰 대상]`, `[Reference]`, `[저장 경로]`를 사용한다.

## 시작 전

1. `[Reference]` 목록의 파일을 순서대로 read한다.
2. `[리뷰 대상]` plan 본문을 read한다.
3. plan에서 언급된 모듈의 `index.ts` / `README.md`가 있으면 read한다.
4. `[저장 경로]`와 동일한 slug의 기존 리뷰 파일이 있으면 직전 리뷰로 인식하고 delta 위주로 평가한다.
5. plan이 내부 라이브러리·SDK·API·CLI를 포함하지 않는다면 "DevEx review: 개발자 노출 API 없음 — 해당 없음" 한 줄로 끝낸다.

## DX 골든 스탠다드 참고

DX 패턴 비교가 필요하면 `./dx-hall-of-fame.md`의 해당 Pass 섹션만 부분 read한다.

## 평가 항목

### 1. API 표면

- 함수·타입 명명이 의도를 즉시 드러내는가?
- 잘못된 인자를 컴파일 타임에 잡을 수 있는가? (TypeScript 타입 활용)
- 에러 시그널이 명확한가? (반환 타입, throw vs return error 일관성)
- ID나 파라미터에 prefix가 없어 잘못된 타입이 혼입될 여지가 있는가?

### 2. 문서·예제

- 첫 사용자가 7줄 이하의 코드로 핵심 기능을 사용할 수 있는가?
- 코드 예제가 실제 작동하는 코드인가 (의사 코드가 아닌)?
- JSDoc / TypeScript 타입이 자체 문서화 역할을 하는가?

### 3. 학습 곡선 / Golden Path

- "처음 사용할 때" 경험이 단순한가? 선택지가 너무 많아 결정 피로를 주지 않는가?
- 신규 팀원이 2주 안에 작은 기능을 스스로 추가할 수 있는 구조인가?
- 자주 쓰는 케이스가 드물게 쓰는 케이스보다 더 적은 코드로 작성 가능한가?

### 4. 디버깅성·관측 가능성

- 에러 메시지가 구체적이고 행동 가능한가? ("something went wrong" 금지)
- 에러에 context(파일명·라인·입력값)가 포함됐는가?
- 로그·메트릭이 문제 진단에 충분한가?

### 5. 마이그레이션·Breaking Change

- 기존 코드와 호환되는가? Breaking change가 있다면 마이그레이션 가이드가 있는가?
- Deprecation 전략이 있는가? (경고 → 제거 단계)
- 버전 관리 전략이 명확한가?

## 추가 지시

- 이슈가 없는 섹션도 "문제 없음" 한 줄로 확인한다.

## 완료

`_shared.md`의 출력 형식에 따라 결과를 `[저장 경로]`에 Write한다.
dispatcher에 회신: `DevEx: <Status> — <저장 경로>`

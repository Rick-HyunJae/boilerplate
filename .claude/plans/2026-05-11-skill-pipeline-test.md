# Plan: Skill Pipeline End-to-End Test

**Date:** 2026-05-11
**Branch:** `test/skill-pipeline-2026-05-11` (worktree)
**Type:** 메타-플랜 (스킬/에이전트 통합 동작 검증)

## Context

`docs/subagent-agent-type-selection` 브랜치에서 다수의 스킬·에이전트·룰을 재정비했다. 이제 CLAUDE.md에 선언된 표준 파이프라인이 **실제로 end-to-end로 동작하는지** 검증할 필요가 있다.

이 플랜은 **무엇을 만들지**가 아니라 **파이프라인을 어떻게 검증할지**를 정의한다. 산출되는 코드는 검증이 끝나면 폐기한다.

## 검증 대상 파이프라인

CLAUDE.md "작업 프로세스 파이프라인" 정의:

```
deep-interview → brainstorming → writing-plans → review-plan-by-persona (optional)
  → subagent-driven-development (TDD 중첩) → verification-before-completion
  → finishing-a-development-branch
```

## 테스트 시나리오

### 테스트 대상 (가상 작업)

**`useDebounce` 훅을 `shared/lib/hooks/`에 추가** — 단순하지만 다음을 동시에 자극한다.

- FSD 레이어 배치 결정 (`shared/lib` vs `shared/hooks`)
- React 19 패턴 (`useEffect` vs `useEffectEvent` vs `Activity`)
- TDD (테스트 먼저 작성)
- 타입 안전성 (제네릭 타입)

### 격리

- 새 worktree: `.worktrees/skill-pipeline-test`
- 새 브랜치: `test/skill-pipeline-2026-05-11`
- 완료 후 worktree·브랜치 폐기 (merge 안 함)

## 가상 사용자 페르소나

자율 실행을 위해 모든 인터뷰·질문에 일관된 페르소나로 답한다.

```
역할: React 19 + FSD 환경에서 작은 유틸 훅을 빠르게 추가하려는 시니어 프론트엔드 개발자
목표: 검색 입력 디바운싱에 쓸 범용 useDebounce 추가
제약:
  - shared 레이어에만 위치
  - React 19 컨벤션 준수
  - TypeScript 제네릭 지원 (값 타입 무관)
  - 외부 라이브러리 추가 없음
완료 기준:
  - 단위 테스트 통과 (vitest)
  - 기본 사용 예시 작성
  - 기존 ESLint·Prettier 통과
열린 질문은 없음 (의도적으로 좁게 정의)
```

## 단계별 실행 계획

### Stage 0 — 환경 준비 (수동)

- [ ] worktree 생성 (`using-git-worktrees` 스킬 사용)
- [ ] 테스트 평가 로그 파일 초기화: `.claude/plans/2026-05-11-skill-pipeline-test-report.md`

### Stage 1 — deep-interview

- invoke `deep-interview`
- 페르소나로 질문에 답변
- **평가 항목**: 질문 한 번에 하나만 묻는지 / 종료 조건 도달 후 산출물 저장하는지 / 다음 단계 안내가 명시되는지
- **산출물**: `.claude/plans/interviews/2026-05-11-useDebounce.md`

### Stage 2 — brainstorming

- invoke `brainstorming`
- 페르소나로 설계 결정 (어떤 시그니처? 어떤 React API?)
- **평가 항목**: 단일 질문 흐름 / 대안 제시 여부 / 산출물 위치

### Stage 3 — writing-plans

- invoke `writing-plans`
- **평가 항목**: deep-interview·brainstorming 결과를 참조하는지 / plan 파일 위치·헤더 규칙 준수 / TDD 단계 포함 여부
- **산출물**: `.claude/plans/2026-05-11-useDebounce.md` (inner plan)

### Stage 4 — review-plan-by-persona (optional)

- invoke `review-plan-by-persona`
- **평가 항목**: 페르소나 다양성 / 실질적 개선 의견 도출 여부

### Stage 5 — subagent-driven-development

- invoke `subagent-driven-development`
- 내부에서 `test-driven-development` 호출 흐름 관찰
- **평가 항목**: subagent_type 선택 적절성 / task 분할 / TDD 사이클 준수 (RED → GREEN → REFACTOR)
- **산출물**: 실제 코드 (`src/shared/lib/hooks/useDebounce.ts`, `.test.ts`)

### Stage 6 — verification-before-completion

- invoke `verification-before-completion`
- **평가 항목**: 테스트 실행 / lint / typecheck 확인 / 미완료 항목 식별

### Stage 7 — finishing-a-development-branch

- invoke `finishing-a-development-branch`
- **평가 항목**: 옵션 제시 (merge/PR/보류) / 사용자 결정 대기 동작

## 평가 리포트 구조

`.claude/plans/2026-05-11-skill-pipeline-test-report.md`에 각 스킬마다 다음을 기록:

```markdown
## <Skill Name>

- 호출 결과: ✅ / ⚠️ / ❌
- 규약 준수: <관찰 내용>
- 산출물: <경로 또는 "없음">
- 다음 단계 핸드오프: <성공/실패 + 이유>
- 발견된 이슈: <글머리 목록>
- 개선 제안: <한 줄>
```

마지막에 **파이프라인 차원 종합**: handoff 끊김, 산출물 위치 일관성, 사용자 개입 최소화 정도.

## 종료 처리

- 평가 리포트 main 브랜치(또는 현재 작업 브랜치)에 commit (선택)
- worktree 제거 (`git worktree remove`)
- 브랜치 삭제 (`git branch -D test/skill-pipeline-2026-05-11`)

## Verification

테스트가 "성공"했다는 판단 기준:

1. 7개 스킬 모두 호출되고 산출물을 남겼다
2. 각 단계의 산출물이 다음 단계에서 참조 가능했다
3. 리포트에 ❌(blocker)가 0개이거나, 발견 시 명확히 기록되었다

## Critical Files

- `.claude/skills/deep-interview/SKILL.md`
- `.claude/skills/` 하위 각 스킬
- `CLAUDE.md` (파이프라인 정의)
- `.claude/rules/git-workflow.md` (worktree 규칙)

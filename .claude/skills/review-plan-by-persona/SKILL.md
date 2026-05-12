---
name: review-plan-by-persona
description: |
    구현된 brainstorming 또는 plan spec을 4개 페르소나(CEO/Eng/Design/DevEx) 관점에서 병렬 리뷰한다.
    사용자가 명시적으로 이 스킬을 호출했을 때만 동작한다.
    explicit invocation only — do NOT auto-trigger after brainstorming or writing-plans.
argument-hint: '[plan-file-path]'
---

# Plan Persona Review

Implementation plan을 여러 이해관계자 관점에서 병렬로 검토한다.
`reviewers/` 하위의 본 프로젝트용 재작성 reviewer들을 사용한다.

**중요:** 이 스킬은 `brainstorming`이나 `writing-plans`의 자동 흐름에서 트리거되지 않는다.

---

## Step 1 — 리뷰 대상 결정

다음 우선순위 순서로 진행한다:

1. **인자로 파일 경로를 받았으면** 그 파일을 사용한다.
2. **현재 대화 컨텍스트에 plan이 있으면** 그것을 사용한다.
   - "현재 대화의 계획을 리뷰하겠습니다." 라고 알린다.
   - plan 본문이 파일로 없으면 **Step 2 직전에** `.claude/plans/reviews/` 에 임시 저장 여부를 AskUserQuestion으로 확인한다.
     - 동의 시: `<YYYY-MM-DD>-<kebab-title>.md` 형태로 저장 후 해당 경로를 PLAN_PATH로 사용한다.
     - 거부 시: plan 본문을 메모리에만 유지한 채 진행한다.
3. **파일 시스템을 탐색한다** — 각 디렉토리에서 mtime 기준 최신 파일 1개를 후보로 선택:
   - `.claude/plans/`
   - `.claude/plans/specs/`
   - `.claude/plans/interviews/`
   - 후보를 찾으면 "다음 파일을 리뷰하겠습니다: `<path>`" 확인 메시지 출력
4. 모두 없으면 AskUserQuestion으로 경로를 직접 입력해 달라고 요청한다.

**plan-slug 추출 규칙:**
- 파일이 있을 때: 파일 stem (확장자 제거). 예: `2026-05-10-auth-refactor.md` → `2026-05-10-auth-refactor`
- 컨텍스트-only일 때: dispatcher가 `<YYYY-MM-DD>-<kebab-title>` 형태로 생성

PLAN_PATH가 결정되면 dispatcher가 **plan 본문을 read**해서 이후 단계(페르소나 추천·reference 추천)에 활용한다.

---

## Step 2 — 페르소나 선택

AskUserQuestion (multiSelect)으로 어떤 페르소나를 실행할지 선택받는다.

옵션:

- `plan-ceo-review` — 비즈니스/제품 관점: 범위·가치·우선순위·성공 지표
- `plan-eng-review` — 엔지니어링 관점: 아키텍처·리스크·테스트·성능 (가장 많이 쓰임)
- `plan-design-review` — UI/UX 관점: 흐름·상태·일관성·접근성
- `plan-devex-review` — 개발자 경험 관점: API·문서·학습 곡선·디버깅

**추천 기본값 (plan 본문 키워드 기반):**

| Plan 성격 | 추천 |
|---------|------|
| `component / route / page / FSD / shared/ui` 포함 | eng + design + ceo |
| `API / SDK / type / public interface` 포함 | eng + devex |
| 인프라·내부 도구 위주 | eng |
| `feature / 기능 / 사용자 / 화면` 포함 | ceo + eng |

---

## Step 2.5 — Reference 패키지 결정

plan 본문 키워드를 분석해 reference 후보를 구성한 뒤, AskUserQuestion (multiSelect) 1회로 확인받는다.

**기본 reference (선택 불가, 항상 포함):**
- `.claude/rules/karpathy-guideline.md`
- `<PLAN_PATH>`

**페르소나별 자동 후보:**
- Eng 선택 시: `docs/development/patterns.md`, `docs/development/testing.md`, `docs/development/performance.md`
- Design 선택 시: `docs/development/design-quality.md`, `docs/development/fsd-architecture/`
- DevEx 선택 시: plan에서 언급된 모듈의 `index.ts` / `README.md` (존재하는 것만), `reviewers/plan-devex-review/dx-hall-of-fame.md` (부분 read 안내 포함)
- CEO 선택 시: 별도 문서가 없으면 기본 reference만

**delta review (자동):**
`.claude/plans/reviews/<plan-slug>-<persona>.md` 또는 `<plan-slug>-<persona>-r*.md` 가 이미 있으면 mtime 기준 최신 1개를 자동으로 reference에 추가하고 reviewer에 "이전 리뷰 대비 delta 위주로 평가" 지시를 추가한다.

plan 본문에서 명시된 코드 경로(예: `src/features/auth/`)도 후보에 자동 추가한다.

---

## Step 3 — 병렬 Dispatch

선택된 페르소나에 대해 Agent tool (general-purpose)을 **단일 메시지에서 병렬**로 호출한다.

각 호출 프롬프트 구조:

```
[Reviewer]
.claude/skills/review-plan-by-persona/reviewers/<persona>/SKILL.md
(공통 규약: .claude/skills/review-plan-by-persona/reviewers/_shared.md)

[리뷰 대상]
PLAN_PATH: <PLAN_PATH>
(파일이 없으면 아래에 plan 본문을 직접 첨부한다)

[Reference]
- .claude/rules/karpathy-guideline.md
- <페르소나별 자동 추가 목록>
- <delta review 대상 파일 (있으면)>

[저장 경로]
.claude/plans/reviews/<plan-slug>-<persona>.md
(동일 파일이 이미 있으면 -r2, -r3 suffix 사용)

[규약]
- SKILL.md와 _shared.md를 정본으로 따른다
- 평가만 수행. AskUserQuestion 호출 금지
- 결과를 [저장 경로]에 Write한다
- dispatcher 회신은 한 줄: "<persona>: <Status> — <저장 경로>"
```

---

## Step 4 — 결과 합성

각 reviewer의 회신(`<persona>: <Status> — <저장 경로>`)을 모아 dispatcher가 **summary 파일**을 생성한다.

**저장 경로:** `.claude/plans/reviews/<plan-slug>-summary.md`
(재생성이면 `-r2` suffix)

**summary 파일 내용:**

```markdown
# Persona Review Summary — <plan-slug> — YYYY-MM-DD

**Plan:** <PLAN_PATH>
**Personas:** <선택된 페르소나 목록>
**Commit:** <git rev-parse --short HEAD>

## Status

| Persona | Status | Critical | High | 결과 파일 |
|---------|--------|:--------:|:----:|----------|
| CEO     | ...    | N        | N    | [링크]    |
| Eng     | ...    | N        | N    | [링크]    |

## Critical Findings (전 페르소나 통합)

- [Eng F2] <제목> → [상세](<eng 결과 파일>#f2)
- [CEO F1] <제목> → [상세](<ceo 결과 파일>#f1)

(Critical 없으면 "Critical findings 없음.")
```

dispatcher가 콘솔에도 같은 표를 출력한다.

**plan 본문은 변경하지 않는다.**
단, 사용자에게 "plan 파일에 한 줄 링크를 추가할까요?" AskUserQuestion 1회.
동의 시 plan 파일 하단에 다음 한 줄만 추가한다 (기존 줄은 유지):

```markdown
> Reviews: [Summary](.claude/plans/reviews/<slug>-summary.md)
```

---

## Step 5 — Interactive Gap-Resolution Loop

모든 reviewer 결과 파일에서 `Severity: Critical`과 `Severity: High` 항목을 모아 1건씩 AskUserQuestion으로 처리한다.

> `[Persona F#] <제목> (Severity: High)`
> 어떻게 할까요?
>
> 1. 지금 수정 (plan 파일 inline 갱신)
> 2. 알면서 진행 (무시하고 계속)
> 3. Open Question으로 기록 (plan 파일 하단 `## Open Questions`에 append)

- **reviewer 결과 파일은 immutable** — 수정하지 않는다 (history 보존).
- "지금 수정" 선택 시 plan 파일만 수정한다.
- 모든 Critical/High를 처리하면 loop를 종료한다.

---

## Step 6 — Re-score (Optional)

사용자가 수정 후 특정 페르소나를 다시 돌리고 싶다면, 해당 페르소나만 Step 3에서 단독으로 재호출한다. 결과는 `-r2` suffix로 별도 파일에 저장한다. summary 파일도 새로 생성한다.

---

## Step 7 — 종료

콘솔에 최종 결과 표와 생성된 파일 경로 목록을 출력한다.

```
리뷰 완료.

- Approved:     [페르소나 목록]
- Issues Found: [페르소나 목록]
- Critical:     [페르소나 목록]

결과 파일:
- .claude/plans/reviews/<slug>-summary.md
- .claude/plans/reviews/<slug>-eng.md
- ...
```

다른 스킬로 자동 전환하지 않는다.

## Standalone Invocation

선행 산출물(plan 파일)이 없어도 사용자 prompt만으로 동작한다. Step 1의 탐색 순서에 따라 (인자 경로 → 현재 대화 컨텍스트 → 파일 탐색) plan을 확보하고, 대화 컨텍스트에만 있으면 임시 저장 여부를 확인 후 진행한다.

---

## Reviewer 위치

`reviewers/` 디렉토리에 본 프로젝트용으로 재작성된 reviewer들이 있다.
출처·라이선스 정보는 `reviewers/README.md` 참조.

## 다음 단계

리뷰 산출물(`reviews/<slug>-<persona>.md`) 작성 후:
- plan 작성자가 피드백을 반영해 `writing-plans` 로 plan 갱신
- 또는 plan 그대로 진행 시 `executing-plans` / `subagent-driven-development` 호출

# Plans Directory

설계·계획 산출물 저장소.

**전체 워크플로우:**

```
deep-interview → brainstorming → writing-plans → review-plan-by-persona (optional)
              ↓
  subagent-driven-development  (현재 세션, 권장)
              또는
         executing-plans        (별도 세션)
              ↓
  finishing-a-development-branch
```

## 디렉토리 구조

| 경로                            | 스킬                        | 내용                                                                                         |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `.claude/plans/YYYY-MM-DD-*.md` | `writing-plans` / Plan Mode | 태스크 단위 구현 계획 (직속 저장)                                                            |
| `interviews/`                   | `deep-interview`            | 모호한 요청을 정리한 메타 프롬프트                                                           |
| `specs/`                        | `brainstorming`             | 승인된 설계 스펙                                                                             |
| `reviews/`                      | `review-plan-by-persona`    | 페르소나별 리뷰 결과 + summary (immutable, history 누적). 컨텍스트-only plan 임시 저장 포함. |

## Naming Convention

`YYYY-MM-DD-<topic>.md`

- `topic`: kebab-case 영문 또는 한글 (예: `auth-refactor`, `사용자-프로필`)
- 동일 날짜·topic 중복 시: `-v2`, `-v3` suffix

**reviews 디렉토리 명명 규칙:**

| 파일 유형       | 형식                       |
| --------------- | -------------------------- |
| 페르소나별 결과 | `<plan-slug>-<persona>.md` |
| 전체 요약       | `<plan-slug>-summary.md`   |
| 재실행          | `-r2`, `-r3` suffix        |

`<plan-slug>`: plan 파일 stem (예: `2026-05-10-auth-refactor`). 날짜 정보는 slug에 내포됨.

`<persona>`: `ceo` / `eng` / `design` / `devex`

## 산출물 연계

각 산출물 상단에 upstream 파일을 명시한다:

```markdown
**Source:** interviews/2026-05-10-auth-refactor.md
```

- spec → 어떤 interview에서 출발했는지
- plan → 어떤 spec에서 출발했는지
- review → 어떤 plan을 리뷰했는지 (파일 내 **Plan:** 필드)

## Standalone Invocation

각 스킬은 선행 산출물이 없어도 사용자 prompt만으로 단독 호출이 가능하다.

| 스킬                             | 선행 산출물 없을 때 동작                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| `deep-interview`                 | prompt를 Source request로 삼아 인터뷰 시작                               |
| `brainstorming`                  | interviews/ 없으면 prompt + 프로젝트 컨텍스트로 진행                     |
| `writing-plans`                  | spec/interview 없으면 prompt에서 goal·scope·success 추출                 |
| `review-plan-by-persona`         | plan 파일 없으면 대화 컨텍스트에서 확보 후 진행                          |
| `subagent-driven-development`    | prompt에 태스크 명시 시 직접 dispatch, 모호하면 writing-plans로 redirect |
| `executing-plans`                | prompt를 즉석 plan으로 삼아 in-memory TodoWrite 생성                     |
| `using-git-worktrees`            | 항상 단독 동작                                                           |
| `finishing-a-development-branch` | 항상 단독 동작                                                           |

## Git 정책

산출물은 git에 커밋한다 (의사결정 히스토리 보존).
reviews 디렉토리의 파일은 **immutable** — 재실행 시 기존 파일을 수정하지 않고 새 파일을 생성한다.

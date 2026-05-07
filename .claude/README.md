# `.claude/` — Project Scope Configuration

이 디렉토리는 **csr-boilerplate** 프로젝트 전용 Claude Code 설정입니다.
User scope (`~/.claude/`) 의 공통 설정을 보강(extend)하며, 충돌 시 project scope 가 우선 적용됩니다.

## Layout

| Path                  | Purpose                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `settings.json`       | 팀 공유 설정 (committed)                                                                                 |
| `settings.local.json` | 개인 로컬 설정 (gitignored)                                                                              |
| `agents/`             | Project 전용 sub-agent 정의 + `AGENTS.md` 인덱스                                                         |
| `hooks/`              | Lifecycle hook scripts (PreToolUse / PostToolUse / Stop / UserPromptSubmit)                              |
| `rules/`              | `INDEX.md` 진입점 + `guidelines/` (항상 로드) + `architecture/` (설계 제약) + `development/` (개발 규칙) |
| `skills/`             | Skill packages (`SKILL.md` + 옵션 `ref/` `scripts/` `templates/`)                                        |

## Agent / Skill Workflow

- `.claude/` is the source of truth (skills, agents)
- Update Claude-owned agents or skills directly under `.claude/`

## Frontmatter 표준

두 종류의 파일이 frontmatter 를 가지며, 형식은 각각 다음과 같이 단일화합니다.

### `agents/*.md`

```yaml
---
name: <kebab-case>
description: <한 줄, when-to-use 명시>
model: <haiku | sonnet | opus>
tools: [Read, Grep, ...]
---
```

### `skills/*/SKILL.md`

```yaml
---
name: <kebab-case>
description: <한 줄, when-to-use 명시>
---
```

## Rules 분류 기준

| 폴더            | 로드 방식      | 기준                                                               |
| --------------- | -------------- | ------------------------------------------------------------------ |
| `guidelines/`   | 항상 로드      | 모든 코드 변경에 일관되게 적용, 위반 시 즉시 리뷰 차단 수준의 원칙 |
| `architecture/` | 경로 범위 로드 | 설계 구조 제약 — FSD 레이어, React 패턴                            |
| `development/`  | 경로 범위 로드 | 개발 단계 규칙 — 작성 관례, API, 테스트, 환경 설정                 |

항상-로드 컨텍스트 비대화 방지를 위해 `guidelines/` 진입 기준을 엄격히 유지. 그 외는 경로 범위 로드 또는 skill 로 분류.

## Plan / Memory

- 완료된 plan 은 `docs/superpowers/plans/archive/` 로 이동 (활성 plan 만 시야 유지)
- Project memory 는 user-scope `~/.claude/projects/<key>/memory/` 사용 — 별도 export 절차 없음

## Conventions

- 모든 스크립트는 `bash`, repo root 에서 실행됨을 가정
- User scope 와 이름 충돌 금지 — `fsd-` 또는 `csr-` prefix 권장

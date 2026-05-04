# `.claude/` — Project Scope Configuration

이 디렉토리는 **csr-boilerplate** 프로젝트 전용 Claude Code 설정입니다.
User scope (`~/.claude/`) 의 공통 설정을 보강(extend)하며, 충돌 시 project scope 가 우선 적용됩니다.

## Layout

| Path                  | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `settings.json`       | 팀 공유 설정 (committed)                                                    |
| `settings.local.json` | 개인 로컬 설정 (gitignored)                                                 |
| `agents/`             | Project 전용 sub-agent 정의 + `AGENTS.md` 인덱스                            |
| `hooks/`              | Lifecycle hook scripts (PreToolUse / PostToolUse / Stop / UserPromptSubmit) |
| `rules/`              | `INDEX.md` 진입점 + `manual/` (항상 로드) + `auto/` (키워드 조건부 주입)    |
| `skills/`             | Skill packages (`SKILL.md` + 옵션 `ref/` `scripts/` `templates/`)           |

## Agent / Skill Workflow

- `.claude/` is the source of truth (skills, agents)
- `.agents/` is a generated mirror for Codex consumption
- Run `pnpm sync:agents` after changing Claude-owned agents or skills
- `pnpm verify:agents` checks the mirror matches
- 직접 `.agents/` 편집은 PreToolUse hook 으로 차단됨

## Frontmatter 표준

세 종류의 파일이 frontmatter 를 가지며, 형식은 각각 다음과 같이 단일화합니다.

### `rules/auto/*.md` 와 `spec/**/*.md` (hook 매칭)

```yaml
---
trigger_keywords: ['domain-specific-word', '도메인-특화-단어']
trigger_globs: ['src/**/specific/**'] # optional
---
```

- 일반어(`api`, `test`, `mock`, `render` 등) 금지 — false positive 다발
- 미사용 메타필드(`priority`, `related`, `scope`, `applies_to` 등) 금지

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

## Manual 추가 기준 (rules/manual/)

다음 두 조건을 모두 만족할 때만 manual 로 둡니다.

1. 모든 코드 변경에 일관되게 적용되어야 한다
2. 위반 시 즉시 빌드/리뷰가 차단될 정도의 강제력이 필요하다

그 외는 `auto/` 또는 skill 로 분류. 항상-로드 컨텍스트 비대화를 막기 위한 가드.

## Plan / Memory

- 완료된 plan 은 `docs/superpowers/plans/archive/` 로 이동 (활성 plan 만 시야 유지)
- Project memory 는 user-scope `~/.claude/projects/<key>/memory/` 사용 — 별도 export 절차 없음

## Conventions

- 모든 스크립트는 `bash`, repo root 에서 실행됨을 가정
- User scope 와 이름 충돌 금지 — `fsd-` 또는 `csr-` prefix 권장

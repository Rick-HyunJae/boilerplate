# Rules Index

`CLAUDE.md` / `AGENTS.md` 에서 `@.claude/rules/INDEX.md` 한 줄로 import. 이 파일이 rules 의 진입점.

## Spec (프로젝트 사실)

@spec/INDEX.md

## Manual Rules (항상 로드)

@.claude/rules/manual/react-19.md
@.claude/rules/manual/fsd-imports.md

## Auto Rules + Specs (조건부 주입)

`hooks/auto-rules-inject.sh` 가 prompt 키워드 매칭 시 아래 파일들을 컨텍스트에 주입합니다.
spec 파일도 동일한 `trigger_keywords` frontmatter 형식을 사용해 함께 매칭됩니다.

| 파일                                       | Trigger keywords                                            |
| ------------------------------------------ | ----------------------------------------------------------- |
| [auto/api-client.md](./auto/api-client.md) | axios, apiClient, 인터셉터                                  |
| [auto/testing.md](./auto/testing.md)       | vitest, coverage, @testing-library                          |
| [auto/env.md](./auto/env.md)               | VITE\_, .env, 난독화, ENABLE_MOCK, import.meta.env          |
| [auto/prettier.md](./auto/prettier.md)     | 포맷, prettier                                              |
| [auto/comments.md](./auto/comments.md)           | 주석, JSDoc, docstring                                            |
| [auto/import-order.md](./auto/import-order.md)   | import 순서, import-order, 임포트 순서, import type               |
| [auto/spec-sync.md](./auto/spec-sync.md)         | spec, sync, apiClient, env.ts, schema.ts, providers, routes       |

각 spec 파일의 trigger 는 해당 파일 frontmatter 참조.

## 원칙

- **spec**: 프로젝트의 사실(WHAT/WHY) — 코드와 동기화
- **manual**: 모든 작업에 항상 필요한 핵심 제약 (HOW/MUST)
- **auto**: 특정 작업/맥락에서만 필요한 제약 + 사실 (키워드 조건부 주입)
- Rule 은 spec 을 참조(link)하되 사실을 중복 기재하지 않음

## Manual 추가 기준

- 모든 코드 변경에 일관되게 적용되어야 하는가?
- 위반 시 즉시 빌드/리뷰가 차단될 정도의 강제력이 필요한가?
  둘 다 YES 인 경우만 manual. 그 외는 auto 또는 skill 로.

## Frontmatter 표준 (rules/auto + spec)

```yaml
---
trigger_keywords: ['domain-specific-word', '도메인-특화-단어']
trigger_globs: ['src/**/specific/**'] # optional
---
```

- 일반어(`api`, `test`, `mock`, `render` 등) 금지 — false positive 다발
- `priority`, `related` 등 미사용 필드 금지 (도입 시 hook 부터 확장)

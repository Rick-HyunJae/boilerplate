# Rules Index

@spec/INDEX.md

## guidelines/ — 항상 로드 (frontmatter 없음)

| 파일 | 역할 |
| ---- | ---- |
| [guidelines/karpathy-guideline.md](./guidelines/karpathy-guideline.md) | 코딩 철학 — 단순성, 외과적 변경, 목표 주도 실행 |
| [guidelines/spec-sync.md](./guidelines/spec-sync.md) | spec 동기화 원칙 |

## architecture/ — 경로 범위 로드 (paths: frontmatter)

| 파일 | 적용 경로 |
| ---- | --------- |
| [architecture/fsd-imports.md](./architecture/fsd-imports.md) | `src/**/*.{ts,tsx}` |
| [architecture/react-19.md](./architecture/react-19.md) | `src/**/*.{ts,tsx}` |

## development/ — 경로 범위 로드 (paths: frontmatter)

| 파일 | 적용 경로 |
| ---- | --------- |
| [development/comments.md](./development/comments.md) | `src/**/*.{ts,tsx}`, `config/**/*.ts` |
| [development/import-order.md](./development/import-order.md) | `src/**/*.{ts,tsx}` |
| [development/api-client.md](./development/api-client.md) | `src/**/api/**`, `src/shared/api/**` |
| [development/testing.md](./development/testing.md) | `**/*.test.{ts,tsx}`, `src/shared/test/**` |
| [development/env.md](./development/env.md) | `config/env/**`, `src/shared/config/**` |

## 원칙

- **spec**: 프로젝트의 사실(WHAT/WHY) — 코드와 동기화
- **rule**: 코드 작성 시 따라야 할 제약 (HOW/MUST) — spec 을 참조하되 사실을 중복 기재하지 않음

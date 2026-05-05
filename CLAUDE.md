# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@spec/architecture/overview.md
@spec/architecture/fsd-layers.md

## Project Overview

**React 19 + TypeScript CSR** template using **Feature-Sliced Design (FSD)** architecture.

- **Code Standards**: Rules — `.claude/rules/INDEX.md`; Specs — `spec/INDEX.md`
- **Package Manager**: pnpm (Node `24.15.0` pinned via Volta)

## Quick Start Commands

| Command                             | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| `pnpm start:dev`                    | Dev server (http, port 3000, `.env.dev`)    |
| `pnpm start:prod`                   | Prod server (https, port 3000, `.env.prod`) |
| `pnpm build:dev`                    | Dev build (sourcemap: true, noindex)        |
| `pnpm build:prod`                   | Prod build (sourcemap: hidden, SEO meta)    |
| `pnpm preview`                      | Serve build output                          |
| `pnpm test`                         | Vitest watch mode                           |
| `pnpm test:ui`                      | Vitest UI dashboard                         |
| `pnpm test:coverage`                | Coverage report (enforces **80%** minimum)  |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (flat config)                        |
| `pnpm format` / `pnpm format:check` | Prettier code formatting                    |

## Test Execution

```bash
# Watch mode
pnpm test

# Single file
pnpm vitest --config config/vite/vitest.config.ts run <filepath>

# By test name
pnpm vitest --config config/vite/vitest.config.ts run -t "test name"

# Coverage with threshold checks
pnpm test:coverage
```

## Code Style

- 파일 편집 직후 `pnpm format` 실행 — 수동 포맷 금지, 항상 `prettier --write` 로 일관성 유지
- 대량 포맷 변경은 의미 있는 변경과 분리하여 `chore: format` 커밋으로 처리

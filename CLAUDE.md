# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Rules

@.claude/rules/INDEX.md

`.claude/` 가 agent / skill / hook 의 진실 소스. `.agents/` 는 Codex 용 mirror — `pnpm sync:agents` 로만 갱신, 직접 편집 금지.

## Repository Layout

React 19 + TypeScript CSR 템플릿 (Feature-Sliced Design).
구조 상세 → [spec/architecture/overview.md](./spec/architecture/overview.md)

## Commands

Package manager: **pnpm** (Node pinned to `24.15.0` via Volta).

| Command                             | Purpose                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `pnpm start:dev`                    | 개발기 dev server (http, port 3000, `.env.dev`)             |
| `pnpm start:prod`                   | 운영기 dev server (https, port 3000, `.env.prod`)           |
| `pnpm build:dev`                    | 개발기 배포 빌드 (`.env.dev`, sourcemap: true, noindex)     |
| `pnpm build:prod`                   | 운영기 배포 빌드 (`.env.prod`, sourcemap: hidden, SEO meta) |
| `pnpm preview`                      | 빌드 산출물 서빙                                            |
| `pnpm test`                         | Vitest watch mode                                           |
| `pnpm test:ui`                      | Vitest UI                                                   |
| `pnpm test:coverage`                | Run with coverage; thresholds enforced at **80%**           |
| `pnpm lint` / `pnpm lint:fix`       | ESLint flat config                                          |
| `pnpm format` / `pnpm format:check` | Prettier                                                    |
| `pnpm gen:env-example`              | schema → `config/env/.env.example` 자동 생성                |

단일 테스트 실행: `pnpm vitest --config config/vite/vitest.config.ts run <파일경로>`
이름으로 실행: `pnpm vitest --config config/vite/vitest.config.ts run -t "test name"`

Spec 목차 → [spec/INDEX.md](./spec/INDEX.md). 프로젝트 코드 규약은 [.claude/rules/INDEX.md](./.claude/rules/INDEX.md) 가 단일 진입점.

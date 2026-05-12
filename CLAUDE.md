# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript CSR template using Feature-Sliced Design (FSD).

- FSD facts live in `docs/development/fsd-architecture/`
- Detailed guides live in `docs/development/` (coding-style, testing, patterns, security, performance, design-quality, code-review, development-workflow)
- Rules live in `.claude/rules/` — `karpathy-guideline.md` (behavior), `env.md` (env vars), `performance.md` (model selection)
- Package manager: pnpm (Node `24.15.0` pinned via Volta)

## 작업 프로세스 파이프라인

### 기획·구조화 단계

```
deep-interview → brainstorming → writing-plans → review-plan-by-persona (optional)
```

### 구현 실행 단계

plan 파일이 준비되면 아래 둘 중 선택한다.

| 스킬                          | 세션      | 권장 상황                                      |
| ----------------------------- | --------- | ---------------------------------------------- |
| `subagent-driven-development` | 현재 세션 | task가 독립적이고 빠른 반복이 필요할 때 (권장) |
| `executing-plans`             | 별도 세션 | 별도 컨텍스트에서 실행하고 싶을 때             |

구현이 끝나면 반드시 `finishing-a-development-branch`로 마무리한다 (테스트 확인 → merge/PR/보류 선택).

### TDD

모든 구현 작업은 `test-driven-development` 적용 — 테스트 먼저, 코드는 그 다음.

## Plan Mode 산출물 저장 규칙

Plan Mode로 구현 계획을 수립하는 경우, **Plan Mode 진입 직후 `writing-plans` 스킬을 invoke하여 plan 본문을 작성**한다. plan 파일이 완성되면 `ExitPlanMode`를 호출한다.

- **저장 위치:** `.claude/plans/YYYY-MM-DD-<topic>.md`
- **네이밍:** `YYYY-MM-DD-<topic>.md` (topic은 kebab-case 영문)
- **형식:** `writing-plans` 스킬의 Plan Document Header 포함
- **Source 필드:** 파일 상단에 upstream spec 파일 명시 (`**Source:** specs/...`)

단순 분석·탐색 목적의 Plan Mode (구현 계획이 아닌 경우)는 저장하지 않아도 된다.

## Essential Commands

- `pnpm start:dev` - local dev server
- `pnpm start:prod` - local HTTPS server with prod env
- `pnpm build:dev` - dev build
- `pnpm build:prod` - prod build
- `pnpm test` - Vitest
- `pnpm lint` - ESLint
- `pnpm format` - Prettier

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript CSR template using Feature-Sliced Design (FSD).

- FSD facts live in `docs/spec/fsd-architecture/`
- Rules live in `.claude/rules/karpathy-guideline.md` and `.claude/rules/env.md`
- Package manager: pnpm (Node `24.15.0` pinned via Volta)

## Essential Commands

- `pnpm start:dev` - local dev server
- `pnpm start:prod` - local HTTPS server with prod env
- `pnpm build:dev` - dev build
- `pnpm build:prod` - prod build
- `pnpm test` - Vitest
- `pnpm lint` - ESLint
- `pnpm format` - Prettier

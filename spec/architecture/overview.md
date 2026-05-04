---
trigger_keywords: ['아키텍처', 'architecture', '조감도']
trigger_globs: ['src/**']
---

# Architecture Overview

React 19 + TypeScript 기반 CSR(Client-Side Rendering) 템플릿. 아키텍처 패턴으로 **Feature-Sliced Design (FSD)** 를 채택합니다.

기술 스택은 `package.json` 을 참조하세요.

## FSD 레이어 흐름

```
app → pages → widgets → features → entities → shared
```

- 상위 레이어는 하위 레이어만 import 가능 (역방향 금지)
- 같은 레이어 간 cross-slice import 금지 — 상위 레이어에서 조합
- 슬라이스는 `index.ts` Public API 만 노출

레이어별 책임/슬라이스 규칙 → [fsd-layers.md](./fsd-layers.md)
빌드 / 실행 흐름 → [bundle-and-execution.md](./bundle-and-execution.md)
import 제약 → [.claude/rules/manual/fsd-imports.md](/.claude/rules/manual/fsd-imports.md)

## Path Alias

`@/*` → `src/*` (tsconfig.app.json, config/vite/vite.base.ts 양쪽 설정)

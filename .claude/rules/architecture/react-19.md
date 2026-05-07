---
paths:
    - 'src/**/*.{ts,tsx}'
---

# React 19 Conventions (project)

User scope `~/.claude/rules/common/coding-style.md` 를 보강합니다. 충돌 시 본 문서가 우선.

## Component Definition

- ❌ `React.FC` / `React.FunctionComponent` 사용 금지
- ✅ Props 는 named `interface` 로 정의

```tsx
interface UserCardProps {
    userId: string;
    isActive?: boolean;
}

export function UserCard({ userId, isActive = false }: UserCardProps) {
    // ...
}
```

## Imports

- `import type` 사용 (lint rule `@typescript-eslint/consistent-type-imports`)
- 슬라이스 간 import 는 `@/` alias + Public API (slice root) 만 사용

## Hooks

- `useEffect` cleanup 함수에서 race condition 방지 (`ignore` 플래그)
- Custom hook 은 `useXxx` 명명, `model/` segment 에 위치

## Forbidden

- `console.log` (lint error). 디버그는 `console.warn` / `console.error` 한정
- `==` / `!=` (eqeqeq)
- `import.meta.env` 직접 접근 — `@/shared/config/env` 의 `ENV` 사용

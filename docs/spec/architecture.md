---
title: 아키텍처 개요
description: FSD 레이어 흐름, 라우팅 구성, 전역 Provider 정의
---

# 아키텍처 개요

React 19 + TypeScript 기반 CSR(Client-Side Rendering) 템플릿. 아키텍처 패턴으로 **Feature-Sliced Design (FSD)** 를 채택한다.

기술 스택 및 의존성 버전은 `package.json` 을 참조한다.

## FSD 레이어 흐름

```
app → pages → widgets → features → shared
```

- 상위 레이어는 하위 레이어만 import 가능 (역방향 금지)
- 같은 레이어 간 cross-slice import 금지 — 상위 레이어에서 조합
- 슬라이스는 `index.ts` Public API 만 노출

레이어/슬라이스/세그먼트 상세 사양은 다음을 참조한다.

| 주제                    | 문서                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| 레이어 책임 정의        | [./fsd-architecture/01-layers.md](./fsd-architecture/01-layers.md)                     |
| 의존성 규칙 / 위반 코드 | [./fsd-architecture/02-dependency-rules.md](./fsd-architecture/02-dependency-rules.md) |
| 슬라이스 / 세그먼트     | [./fsd-architecture/03-slices-segments.md](./fsd-architecture/03-slices-segments.md)   |
| Public API 패턴         | [./fsd-architecture/04-public-api.md](./fsd-architecture/04-public-api.md)             |
| 코드 배치 결정 가이드   | [./fsd-architecture/05-placement-guide.md](./fsd-architecture/05-placement-guide.md)   |
| 안티패턴                | [./fsd-architecture/06-antipatterns.md](./fsd-architecture/06-antipatterns.md)         |

빌드 / 실행 흐름 → [./build.md](./build.md)
import 제약 → [.claude/rules/architecture/fsd-imports.md](../../.claude/rules/architecture/fsd-imports.md)

## Path Alias

`@/*` → `src/*` (`tsconfig.app.json`, `config/vite/vite.base.ts` 양쪽 설정)

```ts
import { HomePage } from '@/pages/home';
import { apiClient } from '@/shared/api';
```

---

## 라우팅

### 구현 위치

`src/app/routes/index.tsx` — 프로젝트의 유일한 라우트 정의 파일.

### 라우터 타입

`createBrowserRouter` (react-router v7) — HTML5 History API 기반.

### 현재 라우트

```ts
// src/app/routes/index.tsx
export const router = createBrowserRouter([
    { path: '/', element: <HomePage /> },
    { path: '*', element: <NotFoundPage /> },
]);
```

### 새 페이지 추가 절차

1. `src/pages/{name}/` 슬라이스 생성 (세그먼트 + `index.ts`)
2. `src/app/routes/index.tsx` 에 라우트 추가
3. 새 페이지는 `@/pages/{name}` Public API 로만 import

---

## 전역 Provider

### 구현 위치

`src/app/providers/index.tsx` — 전역 Provider 정의.
Provider 트리는 `src/app/index.tsx` 에서 wrapping 한다.

### QueryClient

```ts
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1분
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
```

`src/app/index.tsx` 에서 `<QueryClientProvider client={queryClient}>` 로 주입.

### 새 Provider 추가 방법

`src/app/providers/` 에 추가하고 `src/app/index.tsx` Provider 트리에 wrapping. Provider 순서를 변경하면 의존 관계 문제가 발생할 수 있으므로 변경 시 영향 범위를 확인한다.

---
trigger_keywords: ['react-router', '라우트', '라우팅', 'routing']
trigger_globs: ['src/app/routes/**']
---

# Routing

## 구현 위치

`src/app/routes/index.tsx` — 프로젝트의 유일한 라우트 정의 파일.

## 현재 라우트

```ts
// src/app/routes/index.tsx
export const router = createBrowserRouter([
  { path: '/',  element: <HomePage /> },
  { path: '*',  element: <NotFoundPage /> },
])
```

## 라우터 타입

`createBrowserRouter` (react-router v7) — HTML5 History API 기반.

## 새 페이지 추가 절차

1. `src/pages/{name}/` 슬라이스 생성 (세그먼트 + `index.ts`)
2. `src/app/routes/index.tsx` 에 라우트 추가
3. 새 페이지는 `@/pages/{name}` Public API 로만 import

## 진입점

`src/app/index.tsx` → `<QueryClientProvider>` + `<RouterProvider router={router} />`

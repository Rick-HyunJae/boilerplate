---
trigger_keywords: ['QueryClient', '프로바이더', 'provider']
trigger_globs: ['src/app/providers/**']
---

# Global Providers

## 구현 위치

`src/app/providers/index.tsx`

## 현재 구성

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

Provider 트리는 `src/app/index.tsx` 에서 `<QueryClientProvider client={queryClient}>` 로 주입.

## 새 Provider 추가 방법

`src/app/providers/` 에 추가하고, `src/app/index.tsx` Provider 트리에 wrapping. 기존 Provider 순서를 바꾸면 의존성 문제가 생길 수 있으므로 확인 후 추가.

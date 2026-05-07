---
title: API Client
description: 공통 axios 인스턴스 설정과 인터셉터 동작
---

# API Client

## 구현 위치

`src/shared/api/client.ts` — 프로젝트의 **유일한** axios 인스턴스.

Public API: `@/shared/api` 에서 `apiClient` 를 import 한다.

## 설정

```ts
axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
});
```

`baseURL` 은 `VITE_API_BASE_URL` 환경변수에서 주입된다 (없으면 `/api` fallback).

## 인터셉터

### Request — Authorization 헤더 자동 주입

```ts
const token = localStorage.getItem('token');
if (token) config.headers.Authorization = `Bearer ${token}`;
```

- 토큰 키: `localStorage['token']`
- 토큰이 없으면 헤더 미첨부 (공개 엔드포인트 호환)

### Response — 에러 정규화

```ts
// 성공: response 그대로 통과
// 실패: new Error(message) 로 래핑하여 reject
const message = error.response?.data?.message ?? error.message;
return Promise.reject(new Error(message));
```

에러 처리 시 `error.message` 로 메시지를 꺼내면 된다.

## 사용 패턴

```ts
// features/auth/api/auth.api.ts
import { apiClient } from '@/shared/api';

export async function login(credentials: LoginDto) {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
}
```

## 금지

- `axios.create()` 를 feature/page 등에서 직접 호출하여 새 인스턴스 생성 금지.
- `import.meta.env` 를 `client.ts` 이외에서 직접 접근 금지 (→ `ENV` 객체 사용).

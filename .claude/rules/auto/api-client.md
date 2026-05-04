---
trigger_keywords: ['axios', 'apiClient', '인터셉터', 'interceptor']
trigger_globs: ['src/**/api/**', 'src/shared/api/**']
---

# API Client Rules

사실(설정값, 인터셉터 동작) → [spec/api/client.md](/spec/api/client.md)
이 파일은 코드 작성 시 따라야 할 제약입니다.

## MUST

- `apiClient` 는 반드시 `@/shared/api` 에서 import.
- feature/page 등 어디서도 `axios.create()` 를 직접 호출하여 새 인스턴스 생성 금지.
- 에러 처리 시 인터셉터가 이미 `new Error(message)` 로 래핑하므로 `error.message` 로 접근.

## 패턴

```ts
// ✅ feature api 파일 예시
import { apiClient } from '@/shared/api';

export async function getUser(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
}
```

## 금지

```ts
// ❌ 새 인스턴스 생성
import axios from 'axios';
const client = axios.create({ baseURL: '...' });

// ❌ import.meta.env 직접 접근 (ENV 객체 사용)
const url = import.meta.env.VITE_API_BASE_URL;
```

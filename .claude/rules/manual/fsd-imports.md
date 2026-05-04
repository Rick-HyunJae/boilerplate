---
scope: project
applies_to: ['src/**/*.{ts,tsx}']
---

# FSD Import Rules

사실(구조) 전체는 [spec/architecture/fsd-layers.md](/spec/architecture/fsd-layers.md) 참조.
이 파일은 **코드 작성 시 따라야 할 제약** 만 기술합니다.

## 금지 패턴 (HARD)

### 1. 역방향 import

```ts
// ❌ shared 에서 상위 레이어 import
import { useAuth } from '@/features/auth'; // shared 파일에서 불가
import { HomePage } from '@/pages/home'; // shared/entities/features 에서 불가
```

### 2. 동일 레이어 cross-slice import

```ts
// ❌ features/auth 에서 features/cart import
import { cartStore } from '@/features/cart';

// ✅ pages 또는 widgets 에서 조합
import { useAuth } from '@/features/auth';
import { CartWidget } from '@/widgets/cart';
```

### 3. 슬라이스 내부 직접 접근

```ts
// ❌ index.ts 를 우회한 내부 접근
import { HomePage } from '@/pages/home/ui/HomePage';

// ✅ Public API 경유
import { HomePage } from '@/pages/home';
```

## 허용 패턴

```ts
// ✅ 상위 → 하위 레이어
import { apiClient } from '@/shared/api'; // pages, features, entities 에서 모두 가능
import { UserCard } from '@/entities/user'; // features, widgets, pages 에서 가능

// ✅ 슬라이스 내부에서 상대 경로
import { formatDate } from '../lib/format'; // 같은 슬라이스 내부
```

## 새 슬라이스 추가 체크리스트

- [ ] 레이어 결정: shared → entities → features → widgets → pages 순으로 판단
- [ ] `index.ts` 에 Public API 만 export
- [ ] 슬라이스 간 의존성이 필요하면 상위 레이어에서 조합

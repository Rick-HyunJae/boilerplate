---
trigger_keywords: ['fsd', 'slice', '슬라이스', '세그먼트']
trigger_globs: ['src/features/**', 'src/pages/**', 'src/widgets/**', 'src/entities/**', 'src/shared/**']
---

# FSD Layers

## 레이어별 책임

| 레이어     | 책임                                               | 예시                                |
| ---------- | -------------------------------------------------- | ----------------------------------- |
| `shared`   | 도메인 무관 인프라 (API 클라이언트, 유틸, 공통 UI) | `shared/api`, `shared/lib`          |
| `entities` | 순수 도메인 모델 (데이터 구조, 타입)               | `entities/user`, `entities/product` |
| `features` | 비즈니스 가치가 있는 사용자 상호작용               | `features/auth`, `features/cart`    |
| `widgets`  | 여러 feature/entity 를 조합한 복합 UI              | `widgets/header`, `widgets/sidebar` |
| `pages`    | 라우트 단위 진입점, widget/feature 를 조합         | `pages/home`, `pages/not-found`     |
| `app`      | 전역 설정 — Provider, Router (슬라이스 없음)       | `app/providers`, `app/routes`       |

## 슬라이스 추가 판단 순서

1. 도메인 무관 → `shared`
2. 순수 모델/타입 → `entities`
3. 사용자 상호작용 + 비즈니스 가치 → `features`
4. 복합 UI 블록 → `widgets`
5. 라우트 진입점 → `pages`

## 세그먼트 구조

각 슬라이스는 아래 세그먼트를 가질 수 있습니다.

```
{layer}/{slice}/
├── ui/       # React 컴포넌트
├── model/    # 상태, 훅, 비즈니스 로직
├── api/      # 서버 통신
├── lib/      # 슬라이스 내부 유틸
└── index.ts  # Public API (필수)
```

- `index.ts` 는 외부에 노출할 것만 re-export.
- 세그먼트 파일을 슬라이스 외부에서 직접 import 금지. 반드시 `index.ts` 경유.

## Import 규칙 요약

```ts
// ✅ 허용: 하위 레이어 import
import { apiClient } from '@/shared/api';
import { UserCard } from '@/entities/user';

// ❌ 금지: 상위 레이어 import (역방향)
import { useAuthFeature } from '@/features/auth'; // shared 에서 불가

// ❌ 금지: 동일 레이어 cross-slice import
import { cartStore } from '@/features/cart'; // features/auth 에서 불가

// ❌ 금지: 슬라이스 내부 직접 접근
import { HomePage } from '@/pages/home/ui/HomePage'; // index.ts 경유해야 함
import { HomePage } from '@/pages/home'; // ✅
```

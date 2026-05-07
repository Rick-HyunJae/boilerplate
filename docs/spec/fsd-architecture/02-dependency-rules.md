---
title: FSD 의존성 규칙
description: 레이어 간 import 방향 규칙, 허용·금지 패턴, 위반 코드 정의
---

# FSD 의존성 규칙

## 핵심 원칙

**상위 레이어는 하위 레이어를 import할 수 있다. 역방향은 금지다.**

```
app (5)
 ↓
pages (4)
 ↓
widgets (3)
 ↓
features (2)
 ↓
shared (1)
```

숫자가 작은 레이어는 숫자가 큰 레이어를 import할 수 없다.

---

## 허용 패턴

| 출발 레이어 | 도착 레이어                              | 허용 여부 |
| ----------- | ---------------------------------------- | --------- |
| `app`       | `pages`, `widgets`, `features`, `shared` | ✅        |
| `pages`     | `widgets`, `features`, `shared`          | ✅        |
| `widgets`   | `features`, `shared`                     | ✅        |
| `features`  | `shared`                                 | ✅        |
| `shared`    | 외부 라이브러리만                        | ✅        |

---

## 금지 패턴

### E203: 역방향 import (상위 레이어 참조)

```
# 금지
shared/api   → features/auth      (shared가 features 참조)
features/auth → pages/profile     (features가 pages 참조)
features/auth → widgets/header    (features가 widgets 참조)
```

### E201: 동일 레이어 슬라이스 간 cross-import

```
# 금지
features/auth    → features/cart   (같은 레이어 내 슬라이스 간 참조)
widgets/header   → widgets/sidebar
pages/home       → pages/profile
```

### E202: Public API 우회

```
# 금지
@/features/auth/model/useAuth      (내부 경로 직접 접근)
@/features/auth/ui/LoginForm       (index.ts 우회)

# 허용
@/features/auth                    (index.ts 경유)
```

### E204: Public API 누락

슬라이스 루트에 `index.ts`가 없는 경우.  
외부에서 해당 슬라이스를 import하려면 반드시 `index.ts`가 있어야 한다.

---

## 위반 코드 요약

| 코드 | 유형    | 설명                                    |
| ---- | ------- | --------------------------------------- |
| E201 | Error   | 동일 레이어 슬라이스 간 cross-import    |
| E202 | Error   | index.ts를 우회한 내부 경로 직접 import |
| E203 | Error   | 하위 레이어에서 상위 레이어 import      |
| E204 | Error   | 슬라이스에 index.ts(Public API) 누락    |
| W101 | Warning | 네이밍 컨벤션 불일치                    |

---

## app, shared 레이어의 특례

- `app/`: 가장 상위이므로 모든 레이어를 import 가능
- `shared/`: 레이어 내에서 세그먼트 간 import는 허용 (`shared/lib` → `shared/ui` 등)
- `app/`, `shared/`는 슬라이스가 없으므로 슬라이스 간 cross-import 규칙 미적용

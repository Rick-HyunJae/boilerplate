---
title: 슬라이스와 세그먼트
description: 슬라이스 정의 원칙, 표준 세그먼트 목록, 네이밍 컨벤션
---

# 슬라이스와 세그먼트

## 슬라이스 (Slice)

슬라이스는 레이어 안에서 **비즈니스 도메인** 기준으로 코드를 나누는 단위다.

```
features/
├── auth/          ← 슬라이스
├── add-to-cart/   ← 슬라이스
└── like-post/     ← 슬라이스
```

### 슬라이스 핵심 원칙

| 원칙           | 내용                                                |
| -------------- | --------------------------------------------------- |
| **격리**       | 같은 레이어의 다른 슬라이스를 import하지 않는다     |
| **응집**       | 하나의 목적과 관련된 코드를 한 슬라이스에 모은다    |
| **Public API** | 외부 접근은 반드시 `index.ts`를 통해서만            |
| **독립성**     | 슬라이스 삭제 시 다른 슬라이스에 영향이 없어야 한다 |

### 슬라이스 네이밍

- 형식: **kebab-case** (기본값)
- 기준: 비즈니스 도메인 의미 (기술적 역할 이름 금지)

```
# 권장
features/add-to-cart/
features/user-profile/

# 금지 (기술적 이름)
features/hooks/
features/components/
features/utils/
```

### 슬라이스가 있는 레이어 vs 없는 레이어

| 레이어     | 슬라이스              |
| ---------- | --------------------- |
| `pages`    | 있음                  |
| `widgets`  | 있음                  |
| `features` | 있음                  |
| `app`      | **없음** (세그먼트만) |
| `shared`   | **없음** (세그먼트만) |

---

## 세그먼트 (Segment)

세그먼트는 슬라이스 안에서 **기술적 역할**로 코드를 나누는 단위다.

```
features/auth/
├── ui/       ← UI 컴포넌트
├── model/    ← 상태, 비즈니스 로직
├── api/      ← API 요청
├── lib/      ← 내부 유틸
├── config/   ← 설정
└── index.ts  ← Public API
```

### 표준 세그먼트

| 세그먼트  | 담는 내용                             |
| --------- | ------------------------------------- |
| `ui/`     | UI 컴포넌트, 스타일 관련              |
| `model/`  | 상태 관리, 비즈니스 로직, 타입 정의   |
| `api/`    | API 요청 함수, 쿼리/뮤테이션          |
| `lib/`    | 해당 슬라이스 전용 유틸리티           |
| `config/` | 슬라이스 내 설정값, 상수, 피처 플래그 |

모든 세그먼트가 필수는 아니다. **필요한 것만** 만든다.

### 세그먼트 내 세분화

각 세그먼트 내에도 `index.ts`를 두어 내부 구조를 캡슐화하는 것을 권장한다.

```
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   ├── LogoutButton.tsx
│   └── index.ts        ← 세그먼트 내부 re-export
├── model/
│   ├── types.ts
│   ├── useAuth.ts
│   └── index.ts
└── index.ts            ← 슬라이스 Public API
```

---

## shared/ 레이어의 세그먼트

`shared/`는 슬라이스 없이 세그먼트만으로 구성되며, **세그먼트 간 import가 허용**된다.

```
shared/
├── ui/       ← UI Kit (Button, Input, Modal 등)
├── lib/      ← 범용 유틸리티 (날짜, 포맷, 검증 등)
├── api/      ← HTTP 클라이언트, 엔드포인트 상수
├── config/   ← 환경변수, 앱 설정
└── types/    ← 공통 TypeScript 타입
```

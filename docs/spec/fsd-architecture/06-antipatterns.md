---
title: FSD 안티패턴
description: FSD에서 자주 발생하는 잘못된 패턴과 수정 방법
---

# FSD 안티패턴

## AP-01: 기술적 폴더 분리 (탈세그먼트화)

### 문제

비즈니스 도메인 구분 없이 기술 역할 기준으로 최상위 폴더를 구성한다.

```
# 잘못된 구조
src/
├── components/
│   ├── LoginForm.tsx
│   ├── ProductCard.tsx
│   └── UserAvatar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProduct.ts
│   └── useCart.ts
└── utils/
    ├── formatDate.ts
    └── validateEmail.ts
```

### 증상

- 관련 코드(LoginForm + useAuth + authApi)가 서로 다른 폴더에 분산됨
- 기능 수정 시 여러 폴더를 동시에 열어야 함
- 기능 삭제 시 어느 파일을 지워야 하는지 불명확

### 수정

비즈니스 도메인 기준으로 FSD 레이어에 배치한다.

```
# FSD 구조
features/auth/
├── ui/LoginForm.tsx
├── model/useAuth.ts
└── api/authApi.ts

pages/product-list/
└── ui/ProductCard.tsx

shared/lib/formatDate.ts
```

---

## AP-02: 동일 레이어 슬라이스 간 직접 참조 (E201)

### 문제

같은 레이어의 다른 슬라이스를 직접 import한다.

```
# 금지
features/auth/ → @/features/cart
features/checkout/ → @/features/user-profile
```

### 증상

- 슬라이스 간 숨겨진 의존성 발생
- 한 feature 수정 시 다른 feature가 깨짐

### 수정

**옵션 1:** 공통 로직을 `shared/`로 이동  
**옵션 2:** 상위 레이어(widgets/ 또는 pages/)에서 두 feature를 조합

```
# widgets에서 조합
widgets/auth-cart/
├── ui/AuthCartWidget.tsx   ← features/auth + features/cart를 여기서 조합
└── index.ts
```

---

## AP-03: Public API 우회 (E202)

### 문제

슬라이스 내부 경로를 직접 참조한다.

```
# 금지
@/features/auth/model/useAuth
@/features/auth/ui/LoginForm
```

### 증상

- 슬라이스 내부 구조가 변경되면 외부 코드가 함께 깨짐
- 어디서 무엇을 쓰는지 파악 불가

### 수정

슬라이스의 `index.ts`에 export를 추가하고 그것을 경유한다.

```
# features/auth/index.ts 에 추가
export { useAuth } from './model/useAuth';
export { LoginForm } from './ui/LoginForm';

# 사용처에서
@/features/auth   ← index.ts 경유
```

---

## AP-04: shared/에 비즈니스 로직 배치

### 문제

도메인 특화된 로직이 shared/에 들어간다.

```
# 금지
shared/lib/calculateUserReputation.ts  ← 도메인 로직
shared/lib/formatOrderStatus.ts        ← 도메인 로직
```

### 증상

- shared가 비대해지고 도메인 의존성이 생김
- 어떤 도메인에 속하는지 파악 불가

### 수정

도메인 로직은 해당 feature 안으로.

```
features/user-reputation/lib/calculateReputation.ts
features/order-status/lib/formatStatus.ts
```

---

## 안티패턴 체크리스트

| #   | 확인 항목                                                     | 위반 코드    |
| --- | ------------------------------------------------------------- | ------------ |
| 1   | components/, hooks/, utils/ 같은 기술적 최상위 폴더가 있는가? | AP-01        |
| 2   | 같은 레이어 내 슬라이스 간 import가 있는가?                   | AP-02 / E201 |
| 3   | `index.ts`를 우회하여 내부 경로를 직접 import하는가?          | AP-03 / E202 |
| 4   | shared/에 도메인 특화 로직이 있는가?                          | AP-04        |

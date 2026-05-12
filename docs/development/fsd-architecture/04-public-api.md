---
title: Public API 패턴
description: index.ts 설계 규칙, 위반 유형 정의
---

# Public API 패턴

## 핵심 원칙

모든 슬라이스는 `index.ts`를 통해서만 외부에 노출된다.  
외부에서는 슬라이스 내부 경로를 직접 참조할 수 없다.

```
# 허용
@/features/auth

# 금지 (내부 경로 직접 참조)
@/features/auth/model/useAuth
@/features/auth/ui/LoginForm
@/features/auth/api/authApi
```

---

## index.ts 작성 규칙

### 1. 명시적 Named Export만 허용

```
# 권장
export { LoginForm } from './ui/LoginForm';
export { useAuth } from './model/useAuth';
export type { User } from './model/types';

# 금지 (wildcard)
export * from './ui';
export * from './model';
```

Wildcard export는 무엇이 공개되는지 파악이 어렵고,
tree-shaking 최적화와 순환 참조 방지에 불리하다.

### 2. 노출할 것만 export

내부 구현 세부사항은 export하지 않는다.
외부에서 필요한 컴포넌트, 훅, 타입만 선택적으로 노출한다.

### 3. 슬라이스 루트에 반드시 존재

슬라이스가 외부에서 사용된다면 `index.ts`는 필수다.
누락 시 E204 위반.

---

## index.ts 예시 구조

```
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   └── LogoutButton.tsx
├── model/
│   ├── types.ts
│   └── useAuth.ts
├── api/
│   └── authApi.ts
└── index.ts          ← Public API
```

`index.ts` export 목록 예시:

```
// 노출: LoginForm, LogoutButton (UI)
// 노출: useAuth (model)
// 노출: AuthCredentials 타입 (model/types)
// 미노출: authApi (내부 구현)
```

---

## 위반 유형

| 위반 | 설명                  | 해결                                            |
| ---- | --------------------- | ----------------------------------------------- |
| E202 | 내부 경로 직접 import | 슬라이스 `index.ts`에 export 추가 후 index 경유 |
| E204 | `index.ts` 누락       | 슬라이스 루트에 `index.ts` 생성                 |

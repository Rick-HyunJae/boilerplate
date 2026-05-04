---
trigger_keywords: ['주석', 'comment', 'JSDoc', 'docstring', 'TSDoc']
trigger_globs: ['src/**/*.{ts,tsx}', 'config/**/*.ts']
---

# 주석(Comment) 작성 규칙

이 파일은 TypeScript/TSX 파일 내 주석 작성 방식을 규정합니다.

## 기본 원칙

주석은 **WHY**를 기술한다. 코드가 이미 설명하는 WHAT은 작성하지 않는다.

작성 대상:

- 숨겨진 제약(외부 SDK 요구사항, 버전 quirk)
- 비자명한 설계 결정과 그 근거
- 독자를 놀라게 할 수 있는 동작

## 문장 끝 마침표

주석 문장의 끝에 마침표(`.`)를 사용하지 않는다

## JSDoc 적용 범위

최상단 선언부(함수, 변수·상수, 인터페이스, 컴포넌트)에 JSDoc(`/** ... */`)을 작성한다

| 대상                                          | 작성 여부                  |
| --------------------------------------------- | -------------------------- |
| export 함수 / 플러그인 / 훅                   | ✅ 작성                    |
| export 상수 / 객체 (전역 클라이언트, 설정 등) | ✅ 작성                    |
| export 인터페이스 / 타입 (비자명한 경우)      | ✅ 작성                    |
| 내부 헬퍼 함수                                | ⚠️ WHY가 비자명한 경우에만 |
| barrel `index.ts`                             | ❌ 작성하지 않음           |

## 태그 간 여백 규칙

의미가 다른 태그 그룹 사이에는 빈 줄(`*`)을 삽입한다

```typescript
/**
 * @description 첫 번째 설명
 * 여러 줄도 가능하다
 *
 * @param key {type} 설명
 *
 * @returns 반환값 설명
 * @throws 예외 조건 설명
 */
```

그룹 구분:

1. `@description` 블록 (+ 내부 리스트 포함)
2. `@param` 블록 (연속된 @param은 하나의 그룹)
3. `@returns` + `@throws` 블록

`@description`만 있고 다른 태그가 없다면 빈 줄 불필요

## @param 형식

```
@param name {Type} 설명
```

객체 타입 파라미터는 속성을 들여쓰기 리스트로 기술한다.

```typescript
/**
 * @param opts {PluginOptions} 플러그인 옵션
 *  - enabled: 활성 여부
 *  - level: 강도 ('low' | 'medium' | 'high'). 기본값: 'medium'
 *  - include: 적용 경로 목록 (선택)
 *  - exclude: 제외 경로 목록 (선택)
 */
```

## 인라인 주석(//) 사용 범위

`//` 주석은 **컴포넌트 내부** 또는 **플러그인·유틸 연계 지점**에만 허용한다

```typescript
// ✅ 컴포넌트 내부 조건 분기에서 비자명한 이유를 설명
// ✅ 플러그인/유틸 호출 시 파라미터 조합의 의도를 설명

// ❌ 객체 속성에 inline 설명 (JSDoc @param 서브 항목으로 대체)
// ❌ WHAT을 설명하는 주석
```

## 다중 행 주석

2줄 이상의 설명이 필요한 경우 `/* ... */` 블록을 사용한다
단, 선언부 최상단에는 항상 JSDoc(`/** ... */`) 형식을 우선한다

## 금지 패턴

```typescript
// ❌ WHAT 설명
// axios 인스턴스를 생성한다
export const apiClient = axios.create({ ... });

// ❌ 객체 속성에 인라인 주석으로 옵션 설명
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1분
        },
    },
});

// ✅ 선언부 최상단 JSDoc으로 WHY 기술
/**
 * @description 앱 전역 TanStack Query 클라이언트
 *
 * - staleTime 60s: 페이지 이동 시 캐시된 데이터를 즉시 사용해 불필요한 재요청을 방지한다
 */
export const queryClient = new QueryClient({ ... });
```

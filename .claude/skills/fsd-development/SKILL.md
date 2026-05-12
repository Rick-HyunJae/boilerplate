---
name: fsd-development
description: >
    FSD 아키텍처 기준으로 개발 진행 안내 및 규칙 준수 검토.
    "FSD 맞게 됐어?", "레이어 위반 확인해줘", "의존성 방향 검토",
    "import 규칙 체크", "어느 레이어에 넣어야 해?", "구조 리뷰해줘" 등의 요청에 사용.
---

# FSD Development Skill

FSD 아키텍처 규칙에 따라 개발을 안내하고, 코드 구조가 FSD 규칙을 준수하는지 검토한다.

---

## 레이어 구조 (5-layer)

```
app (5)    ← 전역 설정, Provider, 라우터
pages (4)  ← 라우트 단위 화면
widgets (3) ← 여러 페이지에서 재사용되는 UI 블록
features (2) ← 사용자 행동 단위 기능
shared (1)  ← 비즈니스 무관 인프라
```

- 상위 레이어(숫자 높음)만 하위 레이어를 import 가능
- 역방향 import 금지
- 같은 레이어 내 슬라이스 간 import 금지
- 슬라이스 접근은 반드시 `index.ts` 경유

---

## 개발 안내 모드

레이어/슬라이스 배치 질문이 들어오면:

### 레이어 결정 기준

```
전역 설정 / Provider / 라우터
  → app/

한 페이지에서만 사용 (재사용 없음)
  → pages/{페이지명}/

여러 페이지에서 공유되는 UI 블록 (헤더, 사이드바 등)
  → widgets/{블록명}/

재사용되는 사용자 행동 ("~할 수 있다")
  로그인, 좋아요, 장바구니 추가 등
  → features/{행동명}/

비즈니스 무관한 공통 인프라
  UI Kit, 유틸리티, HTTP 클라이언트, 상수
  → shared/{세그먼트}/
```

> **Pages First 원칙**: 재사용이 확실하지 않으면 pages/ 또는 widgets/에 먼저 배치한다.  
> 실제로 재사용이 필요해진 시점에 하위 레이어로 이동한다.

---

## 검토 모드

FSD 규칙 준수 여부 검토 요청이 들어오면 아래 절차를 따른다.

### Step 1: 검토 대상 파악

다음 중 제공된 것을 확인한다.

- 디렉토리 트리 구조
- import 목록 또는 파일 내 import 구문
- 특정 슬라이스 또는 레이어 범위

제공되지 않았다면 프로젝트의 디렉토리 구조를 먼저 파악한다.

### Step 2: 레이어 계층 위반 체크 (E203)

각 파일의 import 경로를 확인하여 상위 레이어 참조 여부를 검사한다.

```
레이어 순서 (낮은 숫자 = 하위):
shared(1) → features(2) → widgets(3) → pages(4) → app(5)

규칙: 낮은 숫자 레이어가 높은 숫자 레이어를 import하면 위반
```

확인 항목:

- `shared/`가 `features/`, `widgets/` 등을 참조하는가?
- `features/`가 `pages/`, `widgets/`를 참조하는가?

### Step 3: 슬라이스 격리 체크 (E201)

같은 레이어 내 슬라이스 간 직접 import 여부를 검사한다.

확인 항목:

- `features/A/`가 `features/B/`를 import하는가?
- `widgets/A/`가 `widgets/B/`를 import하는가?

### Step 4: Public API 체크 (E202, E204)

**E202 — 내부 경로 직접 접근:**
슬라이스 내부 경로를 `index.ts` 없이 직접 참조하는가?

```
# 위반 패턴 예시
@/features/auth/model/useAuth
@/features/auth/ui/LoginForm
```

**E204 — index.ts 누락:**
슬라이스 루트에 `index.ts`가 없는가?

### Step 5: 네이밍 컨벤션 체크 (W101)

- 슬라이스 이름이 kebab-case를 따르는가?
- 기술적 이름(`components/`, `hooks/`, `utils/`)이 슬라이스 이름으로 쓰이는가?

### Step 6: 설계 품질 체크

- `shared/`에 도메인 특화 로직이 있는가?
- 한 곳에서만 쓰이는 코드가 features/에 조기 추출되었는가?

---

## 보고 형식

위반이 발견된 경우 아래 형식으로 각 항목을 보고한다.

```
[{코드}] {위반 내용}
📍 위치: {파일 경로 또는 슬라이스 경로}
❓ 이유: {왜 위반인지 한 줄 설명}
✅ 수정: {구체적인 수정 방법}
```

### 예시

```
[E201] features/auth → features/cart (동일 레이어 cross-import)
📍 위치: features/auth/model/session.ts
❓ 이유: features 슬라이스는 독립된 사용자 시나리오여야 합니다.
✅ 수정: 공통 로직을 shared/로 이동하거나, widgets/에서 두 feature를 조합하세요.

[E202] @/features/auth/model/useAuth 직접 접근
📍 위치: pages/home/ui/HomePage.tsx
❓ 이유: index.ts를 우회하면 내부 구조 변경 시 외부 코드가 함께 깨집니다.
✅ 수정: features/auth/index.ts에 useAuth를 export 추가 후 @/features/auth 경유로 접근하세요.
```

---

## 보고 마무리 형식

검토 완료 후 요약을 출력한다.

```
📊 검토 요약
───────────────────────────────
검토 범위: {레이어 또는 슬라이스 목록}
에러:   {E 코드 수}건
경고:   {W 코드 수}건

{에러가 0건이면}
✅ FSD 규칙 위반 없음
```

---

## 위반 코드 기준표

| 코드 | 수준    | 설명                                    |
| ---- | ------- | --------------------------------------- |
| E201 | Error   | 동일 레이어 슬라이스 간 cross-import    |
| E202 | Error   | `index.ts`를 우회한 내부 경로 직접 접근 |
| E203 | Error   | 하위 레이어에서 상위 레이어 import      |
| E204 | Error   | 슬라이스에 `index.ts`(Public API) 누락  |
| W101 | Warning | 네이밍 컨벤션 불일치                    |

---

## 참조 파일

필요 시 `docs/development/fsd-architecture/` 파일을 Read 툴로 읽는다.

| 상황                   | 읽을 파일                                           |
| ---------------------- | --------------------------------------------------- |
| 레이어 역할 재확인     | `docs/development/fsd-architecture/01-layers.md`           |
| 의존성 규칙 상세 확인  | `docs/development/fsd-architecture/02-dependency-rules.md` |
| 슬라이스/세그먼트 기준 | `docs/development/fsd-architecture/03-slices-segments.md`  |
| Public API 패턴 확인   | `docs/development/fsd-architecture/04-public-api.md`       |
| 배치 결정 예시         | `docs/development/fsd-architecture/05-placement-guide.md`  |
| 안티패턴 상세 확인     | `docs/development/fsd-architecture/06-antipatterns.md`     |

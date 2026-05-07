---
name: fsd-setup
description: >
    src/ 하위에 FSD 기본 템플릿 구조를 생성한다.
    "FSD 구조 세팅해줘", "src 초기화", "FSD 폴더 만들어줘",
    "프로젝트 구조 잡아줘" 등의 요청에 사용.
    기존 폴더 트리가 있으면 제거 또는 덮어쓰기를 확인 후 진행.
---

# FSD Setup Skill

`src/` 하위에 FSD 5-layer 기본 템플릿을 생성한다.

---

## Step 0: 레이어 규칙 확인

이 스킬 실행 전 `fsd-development` 스킬을 invoke하여 레이어 구조와 규칙을 확인한다.

---

## Step 1: 기존 구조 확인

`src/` 디렉토리 내 FSD 레이어 폴더(`app/`, `pages/`, `widgets/`, `features/`, `shared/`) 존재 여부를 확인한다.

기존 구조가 있으면 사용자에게 선택을 요청한다.

```
기존 FSD 구조가 감지되었습니다.

발견된 폴더: {존재하는 레이어 목록}

선택:
1. 기존 FSD 폴더 제거 후 재생성
2. 없는 폴더만 추가 (덮어쓰기 없음)
3. 취소
```

---

## Step 2: 기본 템플릿 구조 생성

선택에 따라 아래 구조를 `src/` 하위에 생성한다.

```
src/
├── app/
│   ├── providers/
│   │   └── index.ts
│   ├── styles/
│   └── index.ts
├── pages/
├── widgets/
├── features/
└── shared/
    ├── ui/
    │   └── index.ts
    ├── lib/
    │   └── index.ts
    ├── api/
    │   └── index.ts
    ├── config/
    │   └── index.ts
    └── types/
        └── index.ts
```

### 생성 규칙

- `pages/`, `widgets/`, `features/`는 빈 디렉토리로 생성 (슬라이스는 개발 시 추가)
- `app/`과 `shared/`는 세그먼트 구조와 빈 `index.ts` 포함
- 각 `index.ts`는 빈 파일로 생성 (`export {};` 한 줄 포함)

---

## Step 3: 생성 결과 보고

생성 완료 후 트리를 출력하고 다음 안내를 제공한다.

```
✅ FSD 기본 구조 생성 완료

src/
├── app/          ← Provider, 라우터, 전역 스타일
├── pages/        ← 라우트별 화면 (슬라이스 추가 시 여기에)
├── widgets/      ← 여러 페이지에서 재사용되는 UI 블록
├── features/     ← 사용자 행동 단위 기능
└── shared/       ← 비즈니스 무관 공통 인프라
    ├── ui/       ← UI Kit
    ├── lib/      ← 유틸리티
    ├── api/      ← HTTP 클라이언트
    ├── config/   ← 환경 설정
    └── types/    ← 공통 타입

다음 단계:
- 새 슬라이스 추가 → fsd-development 스킬 참조
- FSD 규칙 검토 → fsd-development 스킬 호출
```

---

## 핵심 제약

- `src/` 외부 파일은 수정하지 않는다
- 기존 비-FSD 파일(`main.tsx`, `App.tsx` 등)은 건드리지 않는다
- 슬라이스 내부 코드(컴포넌트, 훅, 타입)는 생성하지 않는다 — 구조만 생성

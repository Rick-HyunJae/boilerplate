# csr-boilerplate

React 19 + TypeScript 기반의 CSR(Client-Side Rendering) 프로젝트 보일러플레이트입니다. **Feature-Sliced Design (FSD)** 아키텍처를 적용하여 확장 가능하고 유지보수가 용이한 폴더 구조를 제공합니다.

---

## 1. 개발 환경

### 1.1 Tech Stack

| 분류                | 기술                                     | 버전                 |
| ------------------- | ---------------------------------------- | -------------------- |
| Runtime             | Node.js (Volta 고정)                     | `24.15.0`            |
| Package Manager     | pnpm                                     | -                    |
| Language            | TypeScript                               | `^6.0.3`             |
| Framework           | React                                    | `^19.2.5`            |
| Build Tool          | Vite                                     | `^8.0.10`            |
| Routing             | react-router                             | `^7.14.2`            |
| Server State        | @tanstack/react-query                    | `^5.100.6`           |
| HTTP Client         | axios + axios-mock-adapter               | `^1.15.2` / `^2.1.0` |
| Schema / Validation | zod                                      | `^4.4.1`             |
| Test Runner         | Vitest + @testing-library/react          | `^4.1.5`             |
| Test Env            | jsdom                                    | `^25.0.1`            |
| Linter              | ESLint (flat config) + typescript-eslint | `^9.39.4`            |
| Formatter           | Prettier                                 | `^3.8.3`             |

### 1.2 사전 요구사항

- Node.js `24.15.0` 이상 (Volta 사용 권장 — `package.json`의 `volta` 필드로 자동 고정)
- pnpm

### 1.3 시작하기

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정 (개발 환경)
cp config/env/.env.example config/env/.env.dev

# 개발 서버 실행 (http://localhost:3000)
pnpm start:dev
```

### 1.4 주요 스크립트

| 명령어                              | 설명                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `pnpm start:dev`                    | 개발기 dev server (http, port 3000, `.env.dev`)            |
| `pnpm start:prod`                   | 운영기 dev server (https, port 3000, `.env.prod`)          |
| `pnpm build:dev`                    | 개발기 배포 빌드 (`.env.dev`, sourcemap inline, noindex)   |
| `pnpm build:prod`                   | 운영기 배포 빌드 (`.env.prod`, sourcemap hidden, SEO meta) |
| `pnpm preview`                      | 빌드 결과물 로컬 프리뷰                                    |
| `pnpm test`                         | Vitest watch 모드                                          |
| `pnpm test:ui`                      | Vitest UI 모드                                             |
| `pnpm test:coverage`                | 커버리지 리포트 생성 (임계치: 80%)                         |
| `pnpm lint` / `pnpm lint:fix`       | ESLint 검사 / 자동 수정                                    |
| `pnpm format` / `pnpm format:check` | Prettier 포매팅 / 검사                                     |
| `pnpm gen:env-example`              | Zod 스키마 → `config/env/.env.example` 자동 생성           |

### 1.5 환경 변수

환경 파일은 `config/env/` 디렉토리에 위치합니다.

| 파일                      | 용도                  |
| ------------------------- | --------------------- |
| `config/env/.env.dev`     | 개발기 환경 변수      |
| `config/env/.env.prod`    | 운영기 환경 변수      |
| `config/env/.env.example` | 예시 파일 (자동 생성) |

모든 환경 변수는 `VITE_` 접두사를 사용하며, `config/env/index.ts`의 **Zod 스키마**로 빌드 시 자동 검증됩니다. 런타임에서는 반드시 `src/shared/config/env.ts`의 `ENV` 객체를 통해 참조합니다 — 컴포넌트나 피처에서 `import.meta.env`를 직접 참조하지 않습니다.

```ts
// config/env/index.ts — Zod 스키마 + 검증 로더 (빌드 시 검증)
export const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_APP_MODE: z.enum(['dev', 'prod']),
    VITE_APP_TITLE: z.string(),
    VITE_OBFUSCATE: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_HTTPS: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_MOCK: z.enum(['true', 'false']).default('false'),
});

// src/shared/config/env.ts — 런타임 접근 객체
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    APP_MODE: import.meta.env.VITE_APP_MODE as 'dev' | 'prod',
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;
```

### 1.6 빌드 설정

Vite 설정은 `config/vite/` 디렉토리에 위치하며, 환경별로 분리됩니다.

| 파일                           | 역할                                      |
| ------------------------------ | ----------------------------------------- |
| `config/vite/index.ts`         | 진입점 — mode에 따라 base + dev/prod 머지 |
| `config/vite/vite.base.ts`     | 공통 설정 (alias, 환경 검증, HTML 처리)   |
| `config/vite/vite.dev.ts`      | dev server 설정 (HTTPS)                   |
| `config/vite/vite.prod.ts`     | 빌드 최적화 (난독화, chunk split)         |
| `config/vite/vitest.config.ts` | 테스트 전용 Vite 설정                     |

**빌드 기능:**

- **코드 난독화**: `VITE_OBFUSCATE=true` 설정 시 활성화 (운영 빌드)
- **Vendor chunk 분리**: `vendor-react`, `vendor-router`, `vendor-query`로 자동 분리
- **HTML 처리**: `vite-plugin-html`으로 단일 `public/index.html` 템플릿 사용
    - dev 모드: `noindex`, prod 모드: SEO meta 자동 삽입
    - `<%= VITE_APP_TITLE %>` 등 EJS 문법으로 env 값 주입
- **HTTPS**: `start:prod` 실행 시 `@vitejs/plugin-basic-ssl`로 자동 활성화

### 1.7 경로 별칭

`@/*` 별칭은 `src/*`로 매핑됩니다. (`tsconfig.app.json` + `config/vite/vite.base.ts`)

```ts
import { HomePage } from '@/pages/home';
```

### 1.8 테스트

- 테스트 환경은 `jsdom`이며, 글로벌 셋업은 `src/shared/test/setup.ts`에서 처리합니다.
- 공통 렌더 유틸은 `src/shared/test/utils.tsx`에 위치합니다.
- 커버리지 임계치는 lines / functions / branches / statements **80%**로 강제됩니다.

---

## 2. 폴더 구조 (Feature-Sliced Design)

본 보일러플레이트는 [Feature-Sliced Design](https://feature-sliced.design/) 아키텍처를 따릅니다. 기능 단위의 응집도와 레이어 간 단방향 의존성을 통해 코드베이스의 확장성과 가독성을 보장합니다.

### 2.1 전체 구조

```
.
├── public/              # 정적 에셋 (빌드 시 dist/에 그대로 복사)
│   ├── index.html       # HTML 진입점 템플릿 (EJS, vite-plugin-html 처리)
│   └── assets/          # URL 직접 참조 파일 (파비콘, OG 이미지 등)
├── config/              # 빌드/환경 설정 (src 외부)
│   ├── env/             # 환경 변수 파일 및 Zod 스키마
│   │   ├── .env.dev     # 개발기 환경 변수
│   │   ├── .env.prod    # 운영기 환경 변수
│   │   ├── .env.example # 예시 파일 (자동 생성)
│   │   └── index.ts     # Zod 스키마 + 검증 로더 (단일 파일)
│   └── vite/            # Vite 설정
│       ├── index.ts     # 진입점
│       ├── vite.base.ts # 공통 설정 (HTML 처리 포함)
│       ├── vite.dev.ts  # dev server 설정
│       ├── vite.prod.ts # 배포 빌드 설정
│       ├── vitest.config.ts
│       └── plugins/     # 커스텀 Vite 플러그인
└── src/
    ├── app/         # 앱 초기화 (providers, router) — 최상위 레이어
    │   ├── providers/
    │   ├── routes/
    │   └── index.tsx
    ├── pages/       # 라우트 단위 페이지 컴포지션
    │   ├── home/
    │   └── not-found/
    ├── widgets/     # 독립적인 큰 UI 블록 (헤더, 사이드바 등)
    ├── features/    # 사용자 인터랙션 단위 (로그인, 검색 등)
    └── shared/      # 재사용 가능한 인프라 / UI / 유틸 — 최하위 레이어
        ├── api/     # axios 클라이언트, 인터셉터
        ├── config/  # ENV 런타임 접근 객체
        ├── lib/     # 도메인 비종속 유틸리티
        ├── test/    # 테스트 셋업/유틸
        ├── types/   # 글로벌 타입
        └── ui/      # 디자인 시스템 / 공용 컴포넌트
```

### 2.2 레이어 정의

레이어는 **위에서 아래로** 의존합니다 (상위 레이어만 하위 레이어를 import할 수 있음).

| 레이어     | 책임                                         | 예시                                    |
| ---------- | -------------------------------------------- | --------------------------------------- |
| `app`      | 앱 부트스트랩, 글로벌 프로바이더, 라우팅     | `QueryClientProvider`, `RouterProvider` |
| `pages`    | 라우트 단위 페이지. widgets/features 를 조립 | `HomePage`, `NotFoundPage`              |
| `widgets`  | 페이지를 구성하는 독립적 블록                | `Header`, `Sidebar`, `ProductList`      |
| `features` | 비즈니스 가치를 제공하는 인터랙션            | `auth/login`, `cart/add-to-cart`        |
| `shared`   | 도메인 비종속 인프라 / 유틸 / UI 키트        | `apiClient`, `Button`, `useDebounce`    |

### 2.3 슬라이스 내부 구조 (Segments)

각 슬라이스(예: `features/auth`, `pages/home`)는 다음 세그먼트로 구성됩니다:

```
features/auth/
├── ui/         # React 컴포넌트
├── model/      # 상태, 비즈니스 로직 (hooks, store)
├── api/        # 해당 슬라이스 전용 API 호출
├── lib/        # 슬라이스 내부 유틸
└── index.ts    # Public API (반드시 존재)
```

### 2.4 Public API 규칙 (CRITICAL)

**모든 슬라이스는 반드시 `index.ts`를 통해서만 외부에 노출되어야 합니다.**

```ts
// GOOD ✅ — Public API를 통한 import
import { HomePage } from '@/pages/home';
import { apiClient } from '@/shared/api';

// BAD ❌ — 슬라이스 내부 파일 직접 참조 금지
import { HomePage } from '@/pages/home/ui/HomePage';
import { apiClient } from '@/shared/api/client';
```

이 규칙은 슬라이스의 캡슐화를 보장하고, 내부 리팩토링 시 외부 영향을 차단합니다.

---

## 3. 의존성 제약 (CRITICAL)

FSD의 핵심 원칙은 **단방향 의존성**입니다. 위반 시 코드 리뷰에서 반드시 차단되어야 합니다.

### 3.1 레이어 간 의존성

```
app → pages → widgets → features → shared
```

- **상위 레이어는 하위 레이어만 import 할 수 있습니다.**
- **하위 레이어는 상위 레이어를 절대 import할 수 없습니다.**

| From → To             | 허용 여부 |
| --------------------- | --------- |
| `pages` → `shared`    | ✅        |
| `pages` → `features`  | ✅        |
| `features` → `shared` | ✅        |
| `shared` → `features` | ❌        |
| `features` → `pages`  | ❌        |
| `widgets` → `pages`   | ❌        |

### 3.2 동일 레이어 슬라이스 간 의존성 금지

같은 레이어 내의 슬라이스는 서로를 import할 수 없습니다.

```ts
// BAD ❌ — features/auth가 features/cart를 참조
// src/features/auth/model/login.ts
import { addToCart } from '@/features/cart';
```

서로 다른 슬라이스를 조합해야 한다면 **상위 레이어(pages, widgets)에서 조립**합니다.

### 3.3 절대 경로 사용

상대 경로(`../../`)로 다른 슬라이스/레이어를 참조하지 않습니다. 항상 `@/` 별칭을 통한 절대 경로를 사용합니다. (슬라이스 내부에서는 상대 경로 허용)

### 3.4 슬라이스 추가 가이드

새 기능을 추가할 때:

1. **shared에 들어갈지** — 도메인과 무관한 유틸/UI인가? → `shared/`
2. **feature인가** — 사용자 인터랙션을 동반한 비즈니스 가치인가? → `features/<name>/`
3. **widget인가** — 여러 features를 조합한 큰 UI 블록인가? → `widgets/<name>/`
4. **page인가** — 라우트와 1:1 대응되는 화면인가? → `pages/<name>/`

각 슬라이스는 생성 즉시 `index.ts`를 만들어 Public API를 정의해야 합니다.

---

## 5. 개발 워크플로우

Claude Code와 함께하는 기능 개발은 스킬 파이프라인을 따른다. 각 스킬은 선행 산출물 없이도 단독 호출이 가능하다.

### 5.1 파이프라인

```
[기획·구조화]
deep-interview → brainstorming → writing-plans → review-plan-by-persona (optional)

[구현 실행]
using-git-worktrees → subagent-driven-development (권장) / executing-plans
                      └─ 각 태스크마다 test-driven-development 적용

[마무리]
finishing-a-development-branch
```

### 5.2 산출물 위치

| 스킬                        | 저장 경로                                        |
| --------------------------- | ------------------------------------------------ |
| `deep-interview`            | `.claude/plans/interviews/YYYY-MM-DD-<topic>.md` |
| `brainstorming`             | `.claude/plans/specs/YYYY-MM-DD-<topic>.md`      |
| `writing-plans` / Plan Mode | `.claude/plans/YYYY-MM-DD-<topic>.md`            |
| `review-plan-by-persona`    | `.claude/plans/reviews/<plan-slug>-<persona>.md` |

세부 규칙은 `.claude/plans/README.md` 참조.

---

## 4. 코딩 컨벤션 요약

- **Immutability**: 객체 변형 금지, 항상 spread/새 객체 반환
- **Naming**: `camelCase`(변수/함수), `PascalCase`(타입/컴포넌트), `UPPER_SNAKE_CASE`(상수), `use*`(훅)
- **Types**: `interface`(객체 형태), `type`(union/intersection). `any` 금지, 외부 입력은 `unknown` 후 narrowing
- **React**: `React.FC` 사용 금지, props는 명시적 `interface` 정의
- **Imports**: `import type` 사용 (`@typescript-eslint/consistent-type-imports` 강제)
- **Console**: `console.log` 금지 (`warn`/`error`만 허용)
- **Equality**: `===` / `!==` 강제 (`eqeqeq`)
- **Files**: 200~400줄 권장, 800줄 최대

ESLint와 Prettier가 위 규칙 다수를 자동 검증/수정하므로, 커밋 전 `pnpm lint && pnpm format:check`를 실행합니다.

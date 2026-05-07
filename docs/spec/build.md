---
title: 빌드 / 환경 설정
description: Vite 명령별 실행 흐름, 번들 출력, 환경변수 스키마와 ENV 객체
---

# 빌드 / 환경 설정

CSR Boilerplate 의 빌드 도구는 **Vite** 이며 설정은 `config/vite/` 에 모여 있다.
환경변수는 `config/env/index.ts` 에서 Zod 로 검증된 뒤 Vite 에 주입된다.

## 명령어별 실행 흐름

### `pnpm start:dev` (개발 서버, dev 환경)

```
vite --config config/vite/index.ts --mode dev
  ├─ loadValidatedEnv('dev', 'config/env') → .env.dev 로드 + Zod 검증
  ├─ mergeConfig(base, dev)
  │   ├─ base: @vitejs/plugin-react, @tailwindcss/vite, @ alias
  │   │   └─ createHtmlPlugin → public/index.html 템플릿, env inject, noindex meta
  │   └─ dev: port 3000, open: true, sourcemap: 'inline', HTTPS: 비활성
  └─ HTML: public/index.html (minify 비활성, robots=noindex, VITE_APP_TITLE 치환)
```

### `pnpm start:prod` (개발 서버, prod 환경)

```
vite --config config/vite/index.ts --mode prod
  ├─ loadValidatedEnv('prod', 'config/env') → .env.prod 로드 + Zod 검증
  ├─ mergeConfig(base, dev)
  │   ├─ base: createHtmlPlugin → public/index.html 템플릿, env inject, SEO meta
  │   └─ dev: port 3000, open: true, sourcemap: 'inline', HTTPS: 활성 (basicSsl)
  └─ HTML: public/index.html (minify 비활성, SEO 메타, VITE_APP_TITLE 치환)
```

> `start:prod` 는 배포용 빌드가 아니라 운영 환경변수를 사용하는 로컬 서버다.
> HTTPS 가 필요한 서드파티 SDK(카카오·네이버 로그인 등)를 개발 중 테스트할 때 사용한다.

### `pnpm build:dev` (개발기 배포 빌드)

```
tsc -b && vite build --config config/vite/index.ts --mode dev
  ├─ TypeScript 타입 검사 (실패 시 빌드 중단)
  ├─ loadValidatedEnv('dev', 'config/env')
  ├─ mergeConfig(base, prod)           ← build 커맨드는 항상 prod 빌드 설정
  │   ├─ target: ES2022
  │   ├─ minify: 'oxc'
  │   ├─ sourcemap: true              ← dev 모드는 sourcemap 포함
  │   └─ manual chunks: vendor-react, vendor-router, vendor-query
  └─ 플러그인 파이프라인:
      ├─ createHtmlPlugin → public/index.html 을 input, minify, noindex meta, env 치환
      ├─ copyAssetsPlugin
      └─ obfuscatorPlugin (VITE_OBFUSCATE=false → 비활성)
```

### `pnpm build:prod` (운영기 배포 빌드)

```
tsc -b && vite build --config config/vite/index.ts --mode prod
  ├─ (build:dev 와 동일 구조)
  ├─ sourcemap: 'hidden'              ← 바이너리 외부 보관 (에러 추적용)
  └─ createHtmlPlugin → SEO 메타 태그, index 허용, env 치환
```

## 번들 출력 구조

```
dist/
├── index.html                    # vite-plugin-html 처리 결과 (env 치환 + meta 주입)
├── js/
│   ├── index-[hash].js           # 앱 엔트리
│   ├── vendor-react-[hash].js    # React + ReactDOM
│   ├── vendor-router-[hash].js   # React Router
│   └── vendor-query-[hash].js    # @tanstack/react-query
├── assets/
│   ├── [ext]/[name]-[hash].[ext]  # 번들러가 처리한 이미지·폰트 (해시 포함)
│   └── ...                        # public/assets/ 에서 복사된 정적 파일 (해시 없음)
└── ...                            # public/ 루트 파일 (favicon.ico 등)
```

vendor 청크 분리는 앱 코드 배포 시 변경 없는 vendor 파일의 브라우저 캐시를 보존한다.

## 정적 에셋 (public/)

`public/` 디렉토리(`publicDir`)는 Vite 가 네이티브로 관리한다.

| 경로                    | 서빙 URL          | 빌드 출력             | 특징                                      |
| ----------------------- | ----------------- | --------------------- | ----------------------------------------- |
| `public/index.html`     | `/index.html`     | `dist/index.html`     | vite-plugin-html 이 EJS 처리 후 overwrite |
| `public/assets/foo.png` | `/assets/foo.png` | `dist/assets/foo.png` | 해시 없음, 가공 없음                      |
| `public/favicon.ico`    | `/favicon.ico`    | `dist/favicon.ico`    | 해시 없음, 가공 없음                      |

- URL 로 직접 참조하는 파일(파비콘, OG 이미지, robots.txt 등)은 `public/` 에 배치한다
- 번들러가 처리해야 하는 파일(CSS/JS 에서 `import` 하는 이미지·폰트)은 `src/` 에 배치한다
- `public/assets/` 와 `rollupOptions.output.assetFileNames`(`assets/[ext]/...`) 는 같은 `dist/assets/` 하위에 출력되지만 충돌하지 않는다 (번들러 처리 파일은 반드시 하위 `[ext]/` 폴더에 위치)

---

## 환경 파일 위치

| 파일                      | 용도                                         |
| ------------------------- | -------------------------------------------- |
| `config/env/.env.dev`     | 개발기 환경변수                              |
| `config/env/.env.prod`    | 운영기 환경변수                              |
| `config/env/.env.example` | 예시 파일 (`pnpm gen:env-example` 자동 생성) |

## 환경변수 스키마

`config/env/index.ts` 에서 Zod 로 정의되며 빌드 시 유효성 검사한다.
`envSchema`, `AppEnv`, `loadValidatedEnv` 를 단일 파일에서 export 한다.

```ts
const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_APP_MODE: z.enum(['dev', 'prod']),
    VITE_APP_TITLE: z.string(),
    VITE_OBFUSCATE: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_HTTPS: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_MOCK: z.enum(['true', 'false']).default('false'),
});
```

| 변수                | 타입                | 설명                  |
| ------------------- | ------------------- | --------------------- |
| `VITE_API_BASE_URL` | `string (url)`      | axios baseURL         |
| `VITE_APP_MODE`     | `'dev' \| 'prod'`   | 런타임 모드 판별      |
| `VITE_APP_TITLE`    | `string`            | HTML `<title>` 값     |
| `VITE_OBFUSCATE`    | `'true' \| 'false'` | JS 난독화 활성 여부   |
| `VITE_ENABLE_HTTPS` | `'true' \| 'false'` | dev server HTTPS 여부 |
| `VITE_ENABLE_MOCK`  | `'true' \| 'false'` | MSW 목 서버 활성 여부 |

## ENV 객체 (런타임 접근점)

`src/shared/config/env.ts` — **프로젝트에서 `import.meta.env` 를 읽는 유일한 파일.**

```ts
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    APP_MODE: import.meta.env.VITE_APP_MODE as 'dev' | 'prod',
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;
```

런타임에서는 `import { ENV } from '@/shared/config/env'` 로 접근한다.

## 빌드 모드별 차이

| 항목      | dev 빌드                 | prod 빌드                     |
| --------- | ------------------------ | ----------------------------- |
| sourcemap | `true`                   | `'hidden'`                    |
| noindex   | ✅                       | ❌                            |
| HTTPS     | `VITE_ENABLE_HTTPS` 설정 | `VITE_ENABLE_HTTPS` 설정      |
| 난독화    | 비활성                   | `VITE_OBFUSCATE=true` 시 활성 |

### 난독화 활성화

```bash
VITE_OBFUSCATE=true pnpm build:prod
```

## HTML 진입점

단일 파일 `public/index.html` 을 템플릿으로 사용한다. `vite-plugin-html` 의 `createHtmlPlugin` 이 mode 에 따라 meta 태그와 EJS 치환을 처리한다.

| mode   | robots                     | title                           |
| ------ | -------------------------- | ------------------------------- |
| `dev`  | `noindex, nofollow`        | `VITE_APP_TITLE` (.env.dev 값)  |
| `prod` | `index, follow` + SEO 메타 | `VITE_APP_TITLE` (.env.prod 값) |

HTML 내에서 env 값은 EJS 문법으로 참조한다.

```html
<!-- 타이틀에 env 값 삽입 -->
<title><%= VITE_APP_TITLE %></title>

<!-- 외부 스크립트에 env 값 삽입 -->
<script src="https://example.com/gtm?id=<%= VITE_GTM_ID %>"></script>

<!-- meta 태그에 동적 값 삽입 -->
<meta name="api-endpoint" content="<%= VITE_API_BASE_URL %>" />
```

**규칙**

- `config/env/index.ts` 의 `envSchema` 에 등록된 변수만 `inject.data` 로 주입된다.
- 새 변수를 HTML 에서 사용하려면 반드시 스키마에 먼저 추가한 뒤 `.env.*` 파일에 값을 추가한다.

## 앱 실행 흐름

```
public/index.html → /src/main.tsx (createHtmlPlugin entry 설정)
  └─ createRoot('#root').render(<StrictMode><App /></StrictMode>)
       └─ src/app/index.tsx
            ├─ QueryClientProvider (staleTime: 60s, retry: 1)
            └─ RouterProvider
                 ├─ "/" → <HomePage />
                 └─ "*" → <NotFoundPage />
```

## 새 환경변수 추가 절차

1. `config/env/index.ts` — `envSchema` 에 Zod 필드 추가
2. `src/shared/config/env.ts` — `ENV` 객체에 추가
3. `docs/spec/build.md` — 위 스키마 표 갱신
4. `.env.dev` / `.env.prod` — 실제 값 추가

## 관련 spec

- [./architecture.md](./architecture.md) — FSD 전체 레이어 구조 / 라우팅 / Provider
- [./api.md](./api.md) — axios 클라이언트 인터셉터

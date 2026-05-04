---
trigger_keywords: ['환경변수', 'VITE_', '.env', '난독화', 'obfuscate', 'ENABLE_MOCK']
trigger_globs: ['config/env/**', 'src/shared/config/**']
---

# Environment Configuration

## 환경 파일 위치

| 파일                   | 용도            |
| ---------------------- | --------------- |
| `config/env/.env.dev`  | 개발기 환경변수 |
| `config/env/.env.prod` | 운영기 환경변수 |

## 스키마

`config/env/index.ts` 에서 Zod 로 정의. 빌드 시 유효성 검사.
`envSchema`, `AppEnv`, `loadValidatedEnv` 를 단일 파일에서 export한다.

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

## ENV 객체 (런타임 접근점)

`src/shared/config/env.ts` — **프로젝트에서 `import.meta.env` 를 읽는 유일한 파일.**

```ts
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    APP_MODE: import.meta.env.VITE_APP_MODE as 'dev' | 'prod',
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;
```

런타임에서는 `import { ENV } from '@/shared/config/env'` 로 접근.

## 빌드 모드별 차이

| 항목      | dev 빌드                 | prod 빌드                     |
| --------- | ------------------------ | ----------------------------- |
| sourcemap | `true`                   | `hidden`                      |
| noindex   | ✅                       | ❌                            |
| HTTPS     | `VITE_ENABLE_HTTPS` 설정 | `VITE_ENABLE_HTTPS` 설정      |
| 난독화    | 비활성                   | `VITE_OBFUSCATE=true` 시 활성 |

## 난독화

빌드 시 `VITE_OBFUSCATE=true` 를 shell 또는 `.env.prod` 에 설정하면 활성화.

```bash
VITE_OBFUSCATE=true pnpm build:prod
```

## HTML 환경변수 치환 (public/index.html)

`vite-plugin-html`의 `createHtmlPlugin`이 `inject.data`로 전달된 env 값을 EJS 문법으로 치환한다.

```html
<!-- 타이틀에 env 값 삽입 -->
<title><%= VITE_APP_TITLE %></title>

<!-- 외부 스크립트에 env 값 삽입 -->
<script src="https://example.com/gtm?id=<%= VITE_GTM_ID %>"></script>

<!-- meta 태그에 동적 값 삽입 -->
<meta name="api-endpoint" content="<%= VITE_API_BASE_URL %>" />
```

**규칙:**

- `config/env/index.ts`의 `envSchema`에 등록된 변수만 `inject.data`로 주입됨.
- 새 변수를 HTML에서 쓰려면 반드시 `index.ts` 스키마에 먼저 추가 후 `.env.*` 파일에 값 추가.

## 새 환경변수 추가 절차

1. `config/env/index.ts` — `envSchema`에 Zod 필드 추가
2. `src/shared/config/env.ts` — `ENV` 객체에 추가
3. `spec/env/config.md` — 이 스키마 표 갱신
4. `.env.dev` / `.env.prod` — 실제 값 추가

## 주의

- 새 환경변수 추가 시 반드시 `config/env/index.ts` 에 먼저 추가한 뒤 `.env.dev` / `.env.prod` 에 값을 추가.
- `import.meta.env` 를 `src/shared/api/client.ts` 등 다른 파일에서 직접 사용하는 것은 예외적으로 허용된 경우 (client.ts baseURL) 이며, 일반 코드에서는 `ENV` 객체 사용.

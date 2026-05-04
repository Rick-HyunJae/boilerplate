# HTML Env Interpolate Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `index.html` 내 `%VITE_VAR_NAME%` 패턴을 빌드/개발 서버 시 실제 env 값으로 치환하는 Vite 플러그인을 추가한다.

**Architecture:** `config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts`에 `transformIndexHtml` 훅을 사용하는 플러그인을 구현한다. `envSchema.shape` 키셋을 화이트리스트로 사용해 스키마에 등록된 변수만 치환하며, `vite.base.ts`에 플러그인을 추가해 dev/prod 양쪽에서 동작하게 한다.

**Tech Stack:** Vite 6, TypeScript, Zod (envSchema), Vitest

---

## File Map

| 상태 | 파일                                                                  | 역할                  |
| ---- | --------------------------------------------------------------------- | --------------------- |
| 신규 | `config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts`      | 플러그인 본체         |
| 신규 | `config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts` | 단위 테스트           |
| 수정 | `config/vite/vite.base.ts`                                            | 플러그인 등록         |
| 수정 | `spec/env/config.md`                                                  | HTML 치환 문법 문서화 |

---

### Task 1: 실패하는 테스트 작성 (RED)

**Files:**

- Create: `config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts`

- [ ] **Step 1: 테스트 파일 생성**

`config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts` 를 아래 내용으로 생성한다.

```typescript
import type { Plugin } from 'vite';

vi.mock('vite', () => ({
    loadEnv: vi.fn().mockReturnValue({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_APP_MODE: 'dev',
    }),
}));

vi.mock('../../env/schema', () => ({
    envSchema: {
        shape: {
            VITE_API_BASE_URL: {},
            VITE_APP_MODE: {},
        },
    },
}));

import { htmlEnvInterpolatePlugin } from './htmlEnvInterpolate';

function getHandler(plugin: Plugin): (html: string) => string {
    const hook = plugin.transformIndexHtml as { handler: (html: string) => string };
    return hook.handler;
}

describe('htmlEnvInterpolatePlugin', () => {
    test('스키마에 등록된 키를 env 값으로 치환한다', () => {
        const handler = getHandler(htmlEnvInterpolatePlugin('dev', '/fake/env'));

        const result = handler('<meta content="%VITE_API_BASE_URL%">');

        expect(result).toBe('<meta content="https://api.example.com">');
    });

    test('스키마 미등록 키는 원문을 유지한다', () => {
        const handler = getHandler(htmlEnvInterpolatePlugin('dev', '/fake/env'));

        const result = handler('<script src="%VITE_UNKNOWN%"></script>');

        expect(result).toBe('<script src="%VITE_UNKNOWN%"></script>');
    });

    test('HTML 내 여러 패턴을 모두 치환한다', () => {
        const handler = getHandler(htmlEnvInterpolatePlugin('dev', '/fake/env'));

        const result = handler('<meta name="%VITE_APP_MODE%" content="%VITE_API_BASE_URL%">');

        expect(result).toBe('<meta name="dev" content="https://api.example.com">');
    });

    test('공백 포함 패턴은 치환하지 않는다', () => {
        const handler = getHandler(htmlEnvInterpolatePlugin('dev', '/fake/env'));

        const result = handler('% VITE_API_BASE_URL %');

        expect(result).toBe('% VITE_API_BASE_URL %');
    });

    test('플러그인 이름이 html-env-interpolate이다', () => {
        const plugin = htmlEnvInterpolatePlugin('dev', '/fake/env');

        expect(plugin.name).toBe('html-env-interpolate');
    });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
pnpm vitest --config config/vite/vitest.config.ts run config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts
```

예상 출력: `Cannot find module './htmlEnvInterpolate'` 또는 유사한 import 에러로 FAIL

---

### Task 2: 플러그인 구현 (GREEN)

**Files:**

- Create: `config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts`

- [ ] **Step 1: 플러그인 파일 생성**

`config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts` 를 아래 내용으로 생성한다.

```typescript
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { envSchema } from '../../env/schema';

/**
 * @description index.html 내 %VITE_VAR_NAME% 패턴을 환경변수 값으로 치환하는 Vite 플러그인
 * webpack InterpolateHtmlPlugin과 동일한 문법을 지원한다
 * config/env/schema.ts에 등록된 변수만 치환 대상으로 허용해 미등록 변수 노출을 방지한다
 *
 * @param mode {string} Vite 실행 모드 ('dev' | 'prod')
 * @param envDir {string} .env 파일 디렉토리 절대 경로
 *
 * @returns Vite Plugin
 */
export function htmlEnvInterpolatePlugin(mode: string, envDir: string): Plugin {
    const allowedKeys = new Set(Object.keys(envSchema.shape));
    const rawEnv = loadEnv(mode, envDir, '');

    return {
        name: 'html-env-interpolate',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                return html.replace(/%([^%\s]+)%/g, (match, key) => {
                    if (!allowedKeys.has(key)) return match;
                    return rawEnv[key] ?? match;
                });
            },
        },
    };
}
```

- [ ] **Step 2: 테스트 실행 → PASS 확인**

```bash
pnpm vitest --config config/vite/vitest.config.ts run config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts
```

예상 출력: `5 tests passed`

- [ ] **Step 3: 커밋**

```bash
git add config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.test.ts
git commit -m "feat: add htmlEnvInterpolatePlugin for HTML env variable interpolation"
```

---

### Task 3: vite.base.ts에 플러그인 등록

**Files:**

- Modify: `config/vite/vite.base.ts`

- [ ] **Step 1: import 추가 및 plugins 배열에 플러그인 등록**

`config/vite/vite.base.ts` 를 아래와 같이 수정한다.

```typescript
import type { UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { loadValidatedEnv } from '../env/loadEnv';
import { htmlEnvInterpolatePlugin } from './plugins/html-env-interpolate/htmlEnvInterpolate';

/** 프로젝트 루트 절대 경로. Vite `root` 옵션과 플러그인 경로 계산에 사용한다. */
export const root = path.resolve(import.meta.dirname, '../..');

/** .env 파일 디렉토리 절대 경로. Vite `envDir` 및 `loadValidatedEnv` 에 전달한다. */
export const envDir = path.resolve(import.meta.dirname, '../env');

/**
 * @description 모든 환경(dev/prod)에 공통 적용되는 Vite 기본 설정
 * `@` alias, TailwindCSS, React 플러그인, 환경변수 검증을 포함한다
 *
 * @param mode {string} Vite 실행 모드 ('dev' | 'prod')
 *
 * @returns Vite UserConfig (공통)
 */
export default function base({ mode }: { mode: string }): UserConfig {
    loadValidatedEnv(mode, envDir);

    return {
        root,
        envDir,
        resolve: {
            alias: {
                '@': path.resolve(root, 'src'),
            },
        },
        plugins: [tailwindcss(), react(), htmlEnvInterpolatePlugin(mode, envDir)],
        css: {
            preprocessorOptions: {
                scss: {},
            },
        },
    };
}
```

- [ ] **Step 2: 개발 서버 실행으로 동작 확인**

먼저 `index.html`에 테스트용 패턴을 임시 추가해 치환이 일어나는지 확인한다.

```html
<!-- index.html에 임시 추가 -->
<meta name="test-api" content="%VITE_API_BASE_URL%" />
```

```bash
pnpm start:dev
```

브라우저 개발자 도구 → Elements → `<head>` 에서 `content="%VITE_API_BASE_URL%"` 가 아닌 실제 URL 값으로 치환되어 있는지 확인한다. 확인 후 임시 `<meta>` 태그는 제거한다.

- [ ] **Step 3: 커밋**

```bash
git add config/vite/vite.base.ts
git commit -m "feat: register htmlEnvInterpolatePlugin in vite.base.ts"
```

---

### Task 4: spec/env/config.md 갱신

**Files:**

- Modify: `spec/env/config.md`

- [ ] **Step 1: HTML 치환 문법 섹션 추가**

`spec/env/config.md` 의 `## 주의` 섹션 바로 위에 아래 내용을 삽입한다.

삽입할 내용:

    ## HTML 환경변수 치환 (index.html)

    `htmlEnvInterpolatePlugin`이 빌드/개발 서버 시 `index.html` 내 `%VITE_VAR_NAME%` 패턴을 실제 env 값으로 치환한다.

    ```html
    <!-- 외부 스크립트에 env 값 삽입 -->
    <script src="https://example.com/gtm?id=%VITE_GTM_ID%"></script>

    <!-- meta 태그에 동적 값 삽입 -->
    <meta name="api-endpoint" content="%VITE_API_BASE_URL%">
    ```

    **규칙:**
    - `config/env/schema.ts`에 등록된 변수만 치환됨. 미등록 키는 원문 유지.
    - 공백 포함 패턴(`% KEY %`)은 치환하지 않음.
    - 새 변수를 HTML에서 쓰려면 반드시 schema.ts에 먼저 추가 후 `.env.*` 파일에 값 추가.

- [ ] **Step 2: 커밋**

```bash
git add spec/env/config.md
git commit -m "docs: document HTML env interpolation syntax in spec/env/config.md"
```

---

## Verification

모든 태스크 완료 후 전체 테스트를 돌려 기존 커버리지가 깨지지 않았는지 확인한다.

```bash
pnpm test:coverage
```

예상: coverage 80% 이상 유지, 신규 플러그인 파일 커버리지 포함.

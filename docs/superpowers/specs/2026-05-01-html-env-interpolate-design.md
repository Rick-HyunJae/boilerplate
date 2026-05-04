# Design: htmlEnvInterpolatePlugin

## Context

Vite는 JS/TS 파일에서 `import.meta.env.VITE_*`로 환경변수에 접근하지만, `index.html`에서 env 값을 직접 embed하는 기능은 내장되어 있지 않다.

webpack의 `InterpolateHtmlPlugin`처럼 `%VITE_VAR_NAME%` 문법으로 `index.html` 내에 env 값을 치환할 필요가 생겼다. 주요 사용처는 외부 스크립트 삽입(GTM, Analytics 등)과 `<meta>` 태그 동적 content다.

## Goals

- `index.html`에서 `%VITE_VAR_NAME%` 패턴을 빌드/개발 서버 모두에서 실제 env 값으로 치환
- `config/env/schema.ts`에 등록된 변수만 치환 허용 (보안·일관성)
- 기존 커스텀 플러그인 아키텍처(`config/vite/plugins/`)와 동일한 패턴 준수

## Non-Goals

- `index.html` 외 파일(JS, CSS 등)의 치환
- 스키마 미등록 변수의 치환 또는 에러 발생

## Architecture

### 파일 구조

```
config/vite/plugins/
└── html-env-interpolate/
    └── htmlEnvInterpolate.ts        # 플러그인 본체 (신규)

config/vite/plugins/html-env-interpolate/
    └── htmlEnvInterpolate.test.ts   # 단위 테스트 (신규)
```

### 플러그인 로직

```typescript
// config/vite/plugins/html-env-interpolate/htmlEnvInterpolate.ts
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { envSchema } from '../../env/schema';

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

**핵심 결정:**

- `loadEnv(mode, envDir, '')`: prefix 필터 없이 전체 env 읽기. Zod 검증은 `vite.base.ts`의 `loadValidatedEnv`가 이미 수행하므로 중복 검증 불필요
- `envSchema.shape` 키셋이 화이트리스트: 스키마 미등록 키는 원문(`match`) 그대로 반환
- `order: 'pre'`: 다른 HTML 변환 전에 실행

### 통합 위치

`vite.base.ts`에 추가. dev/prod 양쪽에 동작하며 `mode`·`envDir`이 이미 존재한다.

```typescript
// vite.base.ts
import { htmlEnvInterpolatePlugin } from './plugins/html-env-interpolate/htmlEnvInterpolate';

plugins: [tailwindcss(), react(), htmlEnvInterpolatePlugin(mode, envDir)],
```

### 사용 예 (index.html)

```html
<!-- 외부 스크립트에 ID 삽입 -->
<script src="https://example.com/gtm?id=%VITE_GTM_ID%"></script>

<!-- meta 태그에 동적 값 삽입 -->
<meta name="api-endpoint" content="%VITE_API_BASE_URL%" />
```

새 변수 추가 시 기존 규칙 그대로: `config/env/schema.ts` 먼저 등록 → `.env.dev` / `.env.prod` 값 추가.

## Error Handling

- 스키마 미등록 키: 원문 유지 (에러 없음). 오타 방지는 스키마 등록 의무 규칙으로 커버
- env 값이 `undefined`: 원문 유지 (`?? match`)

## Testing

`htmlEnvInterpolate.test.ts`에서 Vitest 단위 테스트:

| 케이스                               | 기대 결과                         |
| ------------------------------------ | --------------------------------- |
| 스키마 등록 키 `%VITE_API_BASE_URL%` | 실제 env 값으로 치환              |
| 스키마 미등록 키 `%VITE_UNKNOWN%`    | 원문 `%VITE_UNKNOWN%` 유지        |
| 빈 값(`''`)인 키                     | 빈 문자열로 치환                  |
| HTML 내 패턴 여러 개                 | 모두 정상 치환                    |
| 공백 포함 `% KEY %`                  | 원문 유지 (정규식 `[^%\s]+` 제외) |

## Spec Sync

구현 완료 후 `spec/env/config.md`에 HTML 치환 문법 관련 내용 추가.

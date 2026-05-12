# Spec: shared-api-controllers

**Date:** 2026-05-12
**Source:** interviews/2026-05-12-shared-api-controllers.md

## Context

현재 보일러플레이트의 `src/shared/api/`는 localStorage 토큰 주입 + 에러 메시지 통일만 수행하는 단순 axios 인스턴스(`client.ts`) 하나로 구성되어 있다. 한편 `api_sample/`에는 wehago 서비스 전용 인증 GW를 통과하는 **axios·fetch·EventSource 3종 컨트롤러**와 `wehago-sign`/`transaction-id`/`timestamp`/`cno`/`Authorization` 헤더 자동 주입, CryptoJS 기반 signature 생성, S3 다운로드, Suspense Promise wrapper 등 풍부한 자산이 들어있고, 보조 utils 12개(+테스트)와 종속 상수 모듈도 함께 들어있다.

이 자산을 **그대로** 공통 API 레이어로 이식해 프로젝트 내에서 axios/fetch/SSE 중 필요한 컨트롤러를 선택적으로 사용할 수 있도록 한다. wehago 인증 로직(헤더 생성·CryptoJS·환경 분기)은 원본 의도 보존을 위해 추상화 없이 그대로 옮긴다. 위치·환경변수 접근 방식·테스트 러너만 보일러플레이트의 FSD + Vite + Vitest 규약에 맞춰 조정한다.

## Goal

`api_sample/`의 컨트롤러 3종 + utils 12개 + 종속 상수와 테스트를 `src/shared/api/` 및 `src/shared/lib/`로 100% 이식하고, 기존 `client.ts`를 대체하며, `api_sample/` 디렉토리를 정리한다.

## Decisions

| 항목 | 결정 |
|------|------|
| 위치 | `src/shared/api/`(컨트롤러), `src/shared/lib/`(utils) |
| 파일명 변경 | `api.ts → http.ts`, `convert.ts → format.ts` (나머지 10개 원본 유지) |
| utils 폴더 구조 | 평면 배치 + `constants/`, `__test__/` 서브폴더 |
| eventSource 폴리필 | `eventsource.js` 1192라인 원본 vendored copy 유지 (npm 패키지 미사용) |
| examples | 실제 import 가능한 `.example.ts` 모듈 + `README.md` |
| env 스키마 | `VITE_BUILD_TYPE`, `VITE_SERVICE_TYPE` 둘 다 신규 추가 (`VITE_APP_MODE`와 병존, 원본 명명 보존) |
| 테스트 | 5개 모두 Vitest로 변환(`jest` → `vi`). `cookie.test.ts`는 실제 cookie 함수를 jsdom으로 검증하도록 재작성 |
| utils export 스타일 | 원본 `default export { ... }` 패턴 유지 |
| 인증 로직 | wehago 전용 헤더·CryptoJS·환경 분기 그대로 이식 |
| PR 단위 | 단일 PR |

## Architecture

### Directory Layout

```
src/shared/api/
├── axios/
│   ├── apiControllers.ts          # createController('basic'|'gw'|'objectStorage'|'uncert'|'dw')
│   └── apiHandlers.ts             # baseRequestHandler, objectStorageRequestHandler, uncertRequestHandler,
│                                   #   dwRequestHandler, responseHandler, requestErrorHandler, responseErrorHandler
├── fetch/
│   ├── HttpFetchClient.ts
│   ├── InterceptorManager.ts      # InterceptorManager + RequestInterceptorManager
│   ├── apiControllers.ts          # createController (HttpFetchClient 기반, 5 타입 동일)
│   ├── apiHandlers.ts             # base / objectStorage / uncert / dw / requestError
│   ├── types.ts                   # TFetchClientConfig, TFetchRequestConfig, RequestInterceptor, ...
│   └── index.ts                   # createController + handlers + types re-export
├── eventSource/
│   ├── eventsource.js             # 1192라인 EventSourcePolyfill 원본
│   ├── eventsourceController.ts   # createRequestHeader 기반 wehago 헤더 주입 + polyfill 래퍼
│   ├── types.ts                   # IEventSourcePolyfill, IEventSourcePolyfillOption, ...
│   └── index.ts                   # eventSourceController + types re-export
├── examples/
│   ├── axios-gw.example.ts
│   ├── axios-objectStorage.example.ts
│   ├── axios-uncert.example.ts
│   ├── axios-dw.example.ts
│   ├── fetch-gw.example.ts
│   ├── eventSource.example.ts
│   ├── README.md                  # 각 example의 사용 시나리오 간략 안내
│   └── index.ts
├── config.ts                      # apiUrl/unCertUrl/objectStorageUrl/dwUrl (ENV 경유 분기)
├── types.ts                       # TController, TRequestHeader
├── util.ts                        # createRequestHeader, createUncertSignature, downloadFileFromS3, wrapPromise
└── index.ts                       # 공용 진입점 — 이름 충돌 회피를 위해 namespace import 재export:
                                   #   export * as axiosApi from './axios'
                                   #   export * as fetchApi from './fetch'
                                   #   export * from './eventSource'
                                   #   export * from './config'; export * from './types'; export * from './util'

src/shared/lib/
├── http.ts                        # ← api_sample/utils/api.ts (getTransactionId, getTimestamp, getLocation)
├── format.ts                      # ← api_sample/utils/convert.ts
├── browser.ts
├── color.ts
├── console.ts
├── cookie.ts
├── copy.ts
├── date.ts
├── download.ts
├── encrypt.ts
├── fullScreen.ts
├── math.ts
├── constants/
│   └── regex.ts                   # api_sample/constants/regex.ts 원본 (locationReg, addCommaReg 등)
├── __test__/
│   ├── http.test.ts               # ← api.test.ts (이름 일치)
│   ├── format.test.ts             # ← convert.test.ts (이름 일치)
│   ├── cookie.test.ts             # 실제 cookie.ts를 jsdom으로 검증하도록 재작성
│   ├── encrypt.test.ts
│   └── math.test.ts
└── index.ts                       # default object들 re-export

config/env/index.ts                # zod 스키마에 VITE_BUILD_TYPE, VITE_SERVICE_TYPE 추가
src/shared/config/env.ts           # ENV에 BUILD_TYPE, SERVICE_TYPE 노출
config/env/.env.dev                # VITE_BUILD_TYPE=dev, VITE_SERVICE_TYPE=wehago 추가
config/env/.env.prod               # VITE_BUILD_TYPE=live, VITE_SERVICE_TYPE=wehago 추가
```

### Removed

- `src/shared/api/client.ts` — wehago 인증 컨트롤러로 대체. grep 결과 외부 참조 없음 확인됨.
- `api_sample/` — 이식·검증 완료 후 디렉토리 전체 삭제.
- 기존 `src/shared/api/index.ts` — 신규 컨트롤러 진입점으로 재작성.

### Dependencies

추가 (pnpm) —
- `crypto-js` + `@types/crypto-js` (wehago-sign 생성, AES/SHA256)
- `qs` + `@types/qs` (fetch 컨트롤러의 URL 쿼리 직렬화)
- `uuid` + `@types/uuid` (`getTransactionId`, popup name)

이미 있음 — `axios`, `zod`, `vitest`, `jsdom`.

## Data Flow

### Request Flow (axios `gw` 컨트롤러 예)

```
[caller]
  └─ const gw = createController('gw', { baseURL?: ... })
  └─ gw.interceptors.request.use(baseRequestHandler, requestErrorHandler)
  └─ gw.interceptors.response.use(responseHandler, responseErrorHandler)
  └─ gw.get('/api/...')
       ↓
  [baseRequestHandler]
     createRequestHeader(fullURL)
        ├─ cookieUtil.getLatestCookie('wehago_s')
        ├─ cookieUtil.getLatestCookie('AUTH_A_TOKEN')
        ├─ cookieUtil.getLatestCookie('h_selected_company_no')
        ├─ apiUtil.getTimestamp()
        ├─ apiUtil.getTransactionId()
        ├─ apiUtil.getLocation(fullURL)  → pathname + search
        └─ CryptoJS HmacSHA256(hash_data, secure_key) → wehago_sign
     headers 주입: wehago-sign, transaction-id, timestamp, cno, Authorization(Bearer)
       ↓
  [axios.request → 네트워크]
       ↓
  [responseHandler / responseErrorHandler] (서비스별 커스터마이징 지점)
```

### Environment Flow

```
.env.dev | .env.prod
  VITE_BUILD_TYPE = 'dev' | 'live'
  VITE_SERVICE_TYPE = 'wehago' | 'wehagom' | 'wehagov' | 'aws'
        ↓
config/env/index.ts (loadValidatedEnv, zod)
        ↓
src/shared/config/env.ts ENV 객체
  ENV.BUILD_TYPE, ENV.SERVICE_TYPE
        ↓
src/shared/api/config.ts
  isLive = ENV.BUILD_TYPE === 'live'
  apiUrl = isLive ? generateGWUrl(ENV.SERVICE_TYPE) : 'http://dev.api.wehago.com'
  unCertUrl, objectStorageUrl, dwUrl 동일 방식
```

## Components

### `src/shared/api/util.ts`

원본 `api_sample/util.ts`의 함수를 그대로 이식한다. import 경로만 보일러플레이트 alias로 치환:
- `../utils/cookie` → `@/shared/lib/cookie`
- `../utils/api` → `@/shared/lib/http` (이름 변경)
- `../utils/browser` → `@/shared/lib/browser`
- `../utils/download` → `@/shared/lib/download`
- `./config` → `./config`

export: `createRequestHeader`, `createUncertSignature`, `downloadFileFromS3`, `wrapPromise`, `createEncryptServiceKey`.

### `src/shared/api/config.ts`

`process.env.BUILD_TYPE`/`SERVICE_TYPE` 참조를 `ENV.BUILD_TYPE`/`ENV.SERVICE_TYPE`으로 치환. 나머지 도메인 분기 로직은 원본 그대로:
- `apiUrl` — isLive 시 `generateGWUrl` 분기, 아니면 dev URL
- `unCertUrl` — isLive 시 `generateUnCertUrl` 분기, 아니면 dev URL
- `objectStorageUrl` = `apiUrl + '/ObjectStorageCommon/services/common'`
- `dwUrl` = `'https://dwapi.wehago.com'`

### `src/shared/api/axios/`, `fetch/`, `eventSource/`

원본 코드 그대로 이식. `import` 경로만 새 위치 기준으로 갱신.
- axios: `createController(type, options)` → `AxiosInstance`
- fetch: `createController(type, options)` → `HttpFetchClient` (request interceptor만 지원)
- eventSource: `eventSourceController(url, options)` → `IEventSourcePolyfill`

### `src/shared/api/examples/`

각 controller 타입별로 실제 인스턴스 + 인터셉터를 등록한 `.example.ts` 모듈. import만 하면 동작하는 살아있는 예시.

예 — `axios-gw.example.ts`:
```ts
import { createController } from '../axios/apiControllers';
import { baseRequestHandler, responseHandler, requestErrorHandler, responseErrorHandler } from '../axios/apiHandlers';

export const gwExampleController = createController('gw');

gwExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);
gwExampleController.interceptors.response.use(responseHandler, responseErrorHandler);
```

`README.md`에는 각 예시의 시나리오·확장 포인트(서비스별 추가 헤더, 응답 정규화)를 짧게 설명.

### `src/shared/lib/`

12개 utils + `constants/regex.ts` + 5개 테스트. 모두 `default export { ... }` 패턴 유지.

`index.ts`는 12개 default object를 일관된 별칭으로 re-export한다:

```ts
export { default as httpUtil } from './http';
export { default as formatUtil } from './format';
export { default as browserUtil } from './browser';
export { default as colorUtil } from './color';
export { default as consoleUtil } from './console';
export { default as cookieUtil } from './cookie';
export { default as copyUtil } from './copy';
export { default as dateUtil } from './date';
export { default as downloadUtil } from './download';
export { default as encryptUtil } from './encrypt';
export { default as fullScreenUtil } from './fullScreen';
export { default as mathUtil } from './math';
export * as regex from './constants/regex';
```

### Env Schema 확장

`config/env/index.ts`:
```ts
export const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_APP_MODE: z.enum(['dev', 'prod']),
    VITE_APP_TITLE: z.string(),
    VITE_OBFUSCATE: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_HTTPS: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_MOCK: z.enum(['true', 'false']).default('false'),
    VITE_BUILD_TYPE: z.enum(['dev', 'live']),
    VITE_SERVICE_TYPE: z.enum(['wehago', 'wehagom', 'wehagov', 'aws']),
});
```

`src/shared/config/env.ts`:
```ts
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    APP_MODE: import.meta.env.VITE_APP_MODE as 'dev' | 'prod',
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
    BUILD_TYPE: import.meta.env.VITE_BUILD_TYPE as 'dev' | 'live',
    SERVICE_TYPE: import.meta.env.VITE_SERVICE_TYPE as 'wehago' | 'wehagom' | 'wehagov' | 'aws',
} as const;
```

`.env.dev`/`.env.prod` 양쪽에 `VITE_BUILD_TYPE`, `VITE_SERVICE_TYPE` 라인 추가.

## Error Handling

원본 동작 그대로 보존 —
- `requestErrorHandler` / `responseErrorHandler`: `Promise.reject(error)` 패스스루
- `createUncertSignature` 실패 시: `console.error('Uncert Signature API Request failure: ', error)` 후 빈 문자열 반환
- `aesDecrypt` 복호화 실패 시: 빈 문자열 반환
- fetch `HttpFetchClient` 의 timeout: `AbortController.abort()` (원본 동작)

서비스별 에러 통일(`new Error(data.message)` 등)은 호출부의 응답 인터셉터에서 처리(기존 `client.ts`의 동작은 제거됨). 필요 시 examples에 옵션 인터셉터로 추가 가능.

## Testing

| 파일 | 변환 내용 |
|------|----------|
| `src/shared/lib/__test__/http.test.ts` | `jest.fn` → `vi.fn`. import alias 갱신. 내용 유지 |
| `src/shared/lib/__test__/format.test.ts` | 동일 |
| `src/shared/lib/__test__/cookie.test.ts` | **재작성** — `jsdom` 환경에서 실제 `cookie.ts`의 `setCookie`/`getCookie`/`removeCookie`를 검증. mock 함수 자체 테스트는 가치 낮으므로 폐기 |
| `src/shared/lib/__test__/encrypt.test.ts` | jest → vi. 내용 유지 |
| `src/shared/lib/__test__/math.test.ts` | 동일 |

컨트롤러(axios/fetch/eventSource) 통합 테스트는 본 PR 범위 밖. 실 사용 시점(features/entities에서 도입)에 추가한다.

## Verification

이식 완료 시 다음을 모두 통과해야 한다:

1. `pnpm test` — utils 테스트 5개 통과
2. `pnpm lint` — 0 error
3. `pnpm build:dev` — 성공
4. `pnpm build:prod` — 성공
5. `tsc -b` — 0 error
6. `src/shared/api/index.ts`에서 핵심 API export 확인:
   - axios `createController`
   - fetch `createController` (네임스페이스 또는 별칭으로 구분)
   - `eventSourceController`
   - 각 핸들러
7. `src/shared/lib/index.ts`에서 utils 12개 + `regex` re-export 확인
8. `examples/*.example.ts`가 type-check 통과 (실제 wehago 환경 호출 검증은 범위 밖)
9. `api_sample/` 디렉토리 완전 삭제 후에도 위 명령 모두 통과
10. 추가된 env 변수가 `.env.dev`/`.env.prod` 양쪽에 정의되어 있고 zod 검증 통과

## Out of Scope

- 컨트롤러 일반화/추상화 (wehago 인증 로직 그대로 유지)
- 컨트롤러 사용처(features/entities) 실제 적용
- `downloadFileFromS3` 실측 검증 (S3 환경 필요)
- 새로운 컨트롤러 타입 추가 (basic/gw/objectStorage/uncert/dw 5종 유지)
- fetch 응답 interceptor 일반화 (의도적 미지원, 원본 설계 유지)
- 컨트롤러 통합 테스트

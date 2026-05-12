# Shared API Controllers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Source:** specs/2026-05-12-shared-api-controllers.md

**Goal:** `api_sample/`의 wehago 인증 API 컨트롤러(axios·fetch·EventSource) + utils 12개 + 테스트를 `src/shared/api/`와 `src/shared/lib/`로 100% 이식하고, 기존 단순 axios client를 대체한 뒤 `api_sample/`을 정리한다.

**Architecture:** 원본 코드 의도(wehago 인증 헤더·CryptoJS signature·환경별 도메인 분기)는 그대로 두고, **위치·환경변수 접근(ENV 객체 경유)·테스트 러너(Vitest)** 만 보일러플레이트 규약에 맞춘다. `src/shared/api/`는 axios/fetch/eventSource 디렉토리로 분리하고 진입점 `index.ts`에서 namespace import로 노출한다. `src/shared/lib/`는 평면 배치 + `constants/`·`__test__/` 서브폴더.

**Tech Stack:** React 19 + TypeScript + Vite + FSD, axios, crypto-js, qs, uuid, Vitest, jsdom, zod.

---

## File Structure

**Created**

```
src/shared/api/
├── axios/{apiControllers,apiHandlers}.ts
├── fetch/{HttpFetchClient,InterceptorManager,apiControllers,apiHandlers,types,index}.ts
├── eventSource/{eventsource.js,eventsourceController,types,index}.ts
├── examples/{axios-gw,axios-objectStorage,axios-uncert,axios-dw,fetch-gw,eventSource}.example.ts
├── examples/{README.md,index.ts}
└── {config,types,util,index}.ts

src/shared/lib/
├── {http,format,browser,color,console,cookie,copy,date,download,encrypt,fullScreen,math}.ts
├── constants/regex.ts
├── __test__/{http,format,cookie,encrypt,math}.test.ts
└── index.ts
```

**Modified**

- `config/env/index.ts` — zod 스키마에 `VITE_BUILD_TYPE`, `VITE_SERVICE_TYPE` 추가
- `src/shared/config/env.ts` — `ENV`에 `BUILD_TYPE`, `SERVICE_TYPE` 노출
- `config/env/.env.dev` — `VITE_BUILD_TYPE=dev`, `VITE_SERVICE_TYPE=wehago`
- `config/env/.env.prod` — `VITE_BUILD_TYPE=live`, `VITE_SERVICE_TYPE=wehago`
- `package.json` — `crypto-js`, `qs`, `uuid` + types
- `src/shared/api/index.ts` — 신규 진입점으로 재작성

**Removed**

- `src/shared/api/client.ts` (외부 참조 없음 확인)
- `api_sample/` 디렉토리 전체

**Renames during port**

| 원본 (`api_sample/`) | 대상 (`src/shared/`) |
|---|---|
| `utils/api.ts` | `lib/http.ts` |
| `utils/convert.ts` | `lib/format.ts` |
| `utils/__test__/api.test.ts` | `lib/__test__/http.test.ts` |
| `utils/__test__/convert.test.ts` | `lib/__test__/format.test.ts` |
| 나머지 utils 10개 | 동일 이름 |

---

## Import Alias Conversion Table

이식 시 모든 파일에서 다음 import 경로를 일괄 치환한다.

| 원본 import | 변경 후 |
|---|---|
| `'../utils/cookie'` / `'~common/utils/cookie'` | `'@/shared/lib/cookie'` |
| `'../utils/api'` / `'~common/utils/api'` | `'@/shared/lib/http'` |
| `'../utils/browser'` | `'@/shared/lib/browser'` |
| `'../utils/download'` | `'@/shared/lib/download'` |
| `'../utils/encrypt'` (테스트) | `'../encrypt'` (lib/__test__ → lib/) |
| `'../constants/regex'` | `'@/shared/lib/constants/regex'` |
| `'./config'` (api_sample/util.ts) | `'./config'` (shared/api 내부 — 그대로) |
| `'./apiHandlers'` 등 (api_sample/내부) | 그대로 (상대 경로 유지) |
| `process.env.BUILD_TYPE` / `SERVICE_TYPE` | `ENV.BUILD_TYPE` / `ENV.SERVICE_TYPE` |

---

## Task 1: Dependencies 추가

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime + types**

Run:
```bash
pnpm add crypto-js qs uuid
pnpm add -D @types/crypto-js @types/qs @types/uuid
```

- [ ] **Step 2: 설치 확인**

Run: `pnpm ls crypto-js qs uuid @types/crypto-js @types/qs @types/uuid`
Expected: 6개 패키지 모두 출력, 버전 명시.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add crypto-js, qs, uuid for wehago api controllers"
```

---

## Task 2: 환경변수 스키마 확장

**Files:**
- Modify: `config/env/index.ts`
- Modify: `src/shared/config/env.ts`
- Modify: `config/env/.env.dev`
- Modify: `config/env/.env.prod`

- [ ] **Step 1: zod 스키마에 신규 키 추가**

`config/env/index.ts`의 `envSchema`에 아래 두 줄 추가:

```ts
VITE_BUILD_TYPE: z.enum(['dev', 'live']),
VITE_SERVICE_TYPE: z.enum(['wehago', 'wehagom', 'wehagov', 'aws']),
```

- [ ] **Step 2: ENV 객체에 노출**

`src/shared/config/env.ts`의 `ENV` 객체에 추가:

```ts
BUILD_TYPE: import.meta.env.VITE_BUILD_TYPE as 'dev' | 'live',
SERVICE_TYPE: import.meta.env.VITE_SERVICE_TYPE as 'wehago' | 'wehagom' | 'wehagov' | 'aws',
```

- [ ] **Step 3: .env.dev에 추가**

```env
VITE_BUILD_TYPE=dev
VITE_SERVICE_TYPE=wehago
```

- [ ] **Step 4: .env.prod에 추가**

```env
VITE_BUILD_TYPE=live
VITE_SERVICE_TYPE=wehago
```

- [ ] **Step 5: 검증 — dev 서버 기동 시 zod 통과**

Run: `pnpm build:dev`
Expected: env 검증 에러 없이 build 성공. 실패 시 zod 스키마와 .env 정렬 재확인.

- [ ] **Step 6: Commit**

```bash
git add config/env/index.ts src/shared/config/env.ts config/env/.env.dev config/env/.env.prod
git commit -m "feat(env): add VITE_BUILD_TYPE and VITE_SERVICE_TYPE"
```

---

## Task 3: shared/lib utils 12개 + constants/regex 이식

**Files:**
- Create: `src/shared/lib/{http,format,browser,color,console,cookie,copy,date,download,encrypt,fullScreen,math}.ts`
- Create: `src/shared/lib/constants/regex.ts`

- [ ] **Step 1: constants/regex.ts 복사**

```bash
mkdir -p src/shared/lib/constants
cp api_sample/constants/regex.ts src/shared/lib/constants/regex.ts
```
(원본이 `api_sample/constants/regex.ts`가 아닌 다른 위치에 있으면 실제 경로 확인 후 복사. 이식 시점에 한 번만 확인하면 됨.)

- [ ] **Step 2: utils 10개를 원본 그대로 복사 (이름 변경 없음)**

```bash
cp api_sample/utils/browser.ts    src/shared/lib/browser.ts
cp api_sample/utils/color.ts      src/shared/lib/color.ts
cp api_sample/utils/console.ts    src/shared/lib/console.ts
cp api_sample/utils/cookie.ts     src/shared/lib/cookie.ts
cp api_sample/utils/copy.ts       src/shared/lib/copy.ts
cp api_sample/utils/date.ts       src/shared/lib/date.ts
cp api_sample/utils/download.ts   src/shared/lib/download.ts
cp api_sample/utils/encrypt.ts    src/shared/lib/encrypt.ts
cp api_sample/utils/fullScreen.ts src/shared/lib/fullScreen.ts
cp api_sample/utils/math.ts       src/shared/lib/math.ts
```

- [ ] **Step 3: api.ts → http.ts 이식**

```bash
cp api_sample/utils/api.ts src/shared/lib/http.ts
```

`src/shared/lib/http.ts` 상단 import 한 줄을 새 경로로 갱신:

```ts
import { v4 as uuid } from 'uuid';
import { locationReg } from '@/shared/lib/constants/regex';
```

(파일 내용 나머지는 원본 그대로. `getTransactionId`, `getLocation`, `getTimestamp`를 default object로 export.)

- [ ] **Step 4: convert.ts → format.ts 이식**

```bash
cp api_sample/utils/convert.ts src/shared/lib/format.ts
```

`src/shared/lib/format.ts` 상단 import 갱신:

```ts
import { addCommaReg, specialTextForNumberReg, koreanReg, englishReg, invalidStringNumericReg } from '@/shared/lib/constants/regex';
```

- [ ] **Step 5: 이식된 파일들의 import 경로 정합**

`browser.ts`는 `uuid` 사용 → 이미 `import { v4 as uuid } from 'uuid'` 형태로 되어 있는지 확인. 필요 시 동일 형태로 보정.
`encrypt.ts`는 `crypto-js` 사용 → 이미 설치되어 있으므로 별도 수정 없음.

- [ ] **Step 6: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 7: Commit**

```bash
git add src/shared/lib/
git commit -m "feat(lib): port api_sample/utils to shared/lib (api→http, convert→format)"
```

---

## Task 4: math.test.ts 변환

**Files:**
- Create: `src/shared/lib/__test__/math.test.ts`

- [ ] **Step 1: 원본 복사**

```bash
mkdir -p src/shared/lib/__test__
cp api_sample/utils/__test__/math.test.ts src/shared/lib/__test__/math.test.ts
```

- [ ] **Step 2: Vitest 형식으로 변환**

`src/shared/lib/__test__/math.test.ts` 최상단에 추가:

```ts
import { describe, it, expect } from 'vitest';
import mathUtil from '../math';
```

원본의 `import` 라인은 모두 제거하고 위 두 줄로 대체. `mathRoundDecimalValue`/`calcDecimalLength`/`floatOperation` 사용 부분은 `mathUtil.xxx` 형태로 유지 또는 분해.

- [ ] **Step 3: 테스트 실행**

Run: `pnpm test src/shared/lib/__test__/math.test.ts --run`
Expected: 모든 케이스 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/__test__/math.test.ts
git commit -m "test(lib): port math test to vitest"
```

---

## Task 5: encrypt.test.ts 변환

**Files:**
- Create: `src/shared/lib/__test__/encrypt.test.ts`

- [ ] **Step 1: 원본 복사**

```bash
cp api_sample/utils/__test__/encrypt.test.ts src/shared/lib/__test__/encrypt.test.ts
```

- [ ] **Step 2: 변환**

상단에 추가:

```ts
import { describe, it, expect } from 'vitest';
import encryptUtil from '../encrypt';
```

원본의 `import encryptUtil from '../encrypt';` 라인이 있으면 그대로 두고 첫 줄만 추가. `jest`/`@ts-ignore` 주석은 그대로 유지(Vitest 호환).

- [ ] **Step 3: 테스트 실행**

Run: `pnpm test src/shared/lib/__test__/encrypt.test.ts --run`
Expected: 4 케이스 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/__test__/encrypt.test.ts
git commit -m "test(lib): port encrypt test to vitest"
```

---

## Task 6: http.test.ts 변환 (← api.test.ts)

**Files:**
- Create: `src/shared/lib/__test__/http.test.ts`

- [ ] **Step 1: 원본 복사 + 이름 변경**

```bash
cp api_sample/utils/__test__/api.test.ts src/shared/lib/__test__/http.test.ts
```

- [ ] **Step 2: 변환**

`src/shared/lib/__test__/http.test.ts`의 import 라인 교체:

```ts
import { describe, it, expect } from 'vitest';
import apiUtil from '../http';

const { getLocation, getTimestamp, getTransactionId } = apiUtil;
```

원본의 `import apiUtil from '../api';` 라인 제거. 나머지 테스트 본문은 그대로 유지.

- [ ] **Step 3: 테스트 실행**

Run: `pnpm test src/shared/lib/__test__/http.test.ts --run`
Expected: 모든 케이스 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/__test__/http.test.ts
git commit -m "test(lib): port api test to vitest as http.test"
```

---

## Task 7: format.test.ts 변환 (← convert.test.ts)

**Files:**
- Create: `src/shared/lib/__test__/format.test.ts`

- [ ] **Step 1: 원본 복사 + 이름 변경**

```bash
cp api_sample/utils/__test__/convert.test.ts src/shared/lib/__test__/format.test.ts
```

- [ ] **Step 2: 변환**

상단 교체:

```ts
import { describe, it, expect } from 'vitest';
import formatUtil from '../format';
```

원본 `import ... from '../convert';` 라인 제거. 본문에서 `convertUtil` 같은 변수명이 있으면 `formatUtil`로 일괄 치환.

- [ ] **Step 3: 테스트 실행**

Run: `pnpm test src/shared/lib/__test__/format.test.ts --run`
Expected: 모든 케이스 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/__test__/format.test.ts
git commit -m "test(lib): port convert test to vitest as format.test"
```

---

## Task 8: cookie.test.ts 재작성

원본은 자체 mock 함수만 테스트하므로 실제 `cookie.ts`의 동작을 jsdom으로 검증하는 새 테스트를 작성한다.

**Files:**
- Create: `src/shared/lib/__test__/cookie.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

```ts
// src/shared/lib/__test__/cookie.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import cookieUtil from '../cookie';

describe('cookie util', () => {
    beforeEach(() => {
        document.cookie.split(';').forEach((c) => {
            const name = c.split('=')[0]?.trim();
            if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
        });
    });

    it('setCookie + getCookie — 저장한 값이 동일하게 읽혀야 한다', () => {
        cookieUtil.setCookie('foo', 'bar', 1, 'localhost');
        expect(cookieUtil.getCookie('foo')).toBe('bar');
    });

    it('getCookie — 존재하지 않는 키는 undefined를 반환한다', () => {
        expect(cookieUtil.getCookie('missing')).toBeUndefined();
    });

    it('removeCookie — 삭제 후 getCookie 결과가 undefined이다', () => {
        cookieUtil.setCookie('foo', 'bar', 1, 'localhost');
        cookieUtil.removeCookie('foo', 'localhost');
        expect(cookieUtil.getCookie('foo')).toBeUndefined();
    });

    it('getLatestCookie — input hidden이 우선, 없으면 쿠키로 fallback', () => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'priority_key';
        input.value = 'from-hidden';
        document.body.appendChild(input);

        cookieUtil.setCookie('priority_key', 'from-cookie', 1, 'localhost');
        expect(cookieUtil.getLatestCookie('priority_key')).toBe('from-hidden');

        document.body.removeChild(input);
        expect(cookieUtil.getLatestCookie('priority_key')).toBe('from-cookie');
    });
});
```

- [ ] **Step 2: 테스트가 통과하는지 확인**

Run: `pnpm test src/shared/lib/__test__/cookie.test.ts --run`
Expected: 4 케이스 PASS (cookie.ts는 이미 이식되어 있음).

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/__test__/cookie.test.ts
git commit -m "test(lib): rewrite cookie test to validate real cookie.ts via jsdom"
```

---

## Task 9: src/shared/lib/index.ts 작성

**Files:**
- Modify: `src/shared/lib/index.ts`

- [ ] **Step 1: index.ts 재작성**

```ts
// src/shared/lib/index.ts
export { default as httpUtil } from './http';
export { default as formatUtil } from './format';
export { default as browserUtil } from './browser';
export { default as colorUtil } from './color';
export { default as consoleUtil } from './console';
export { default as cookieUtil } from './cookie';
export { default as dateUtil } from './date';
export { default as downloadUtil } from './download';
export { default as encryptUtil } from './encrypt';
export { default as fullScreenUtil } from './fullScreen';
export { default as mathUtil } from './math';
export { copyToClipboard } from './copy';
export * as regex from './constants/regex';
```

(`copy.ts`는 named export `copyToClipboard`만 제공하므로 그대로 노출.)

- [ ] **Step 2: 타입 체크 + 테스트**

Run: `pnpm tsc -b && pnpm test --run`
Expected: 타입 0 error, 모든 lib 테스트 PASS.

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/index.ts
git commit -m "feat(lib): expose util default objects via index"
```

---

## Task 10: src/shared/api 공용 파일 이식 (config·types·util)

**Files:**
- Create: `src/shared/api/config.ts`
- Create: `src/shared/api/types.ts`
- Create: `src/shared/api/util.ts`

- [ ] **Step 1: types.ts 복사 (변경 없음)**

```bash
cp api_sample/types.ts src/shared/api/types.ts
```

- [ ] **Step 2: config.ts 이식 (ENV 경유로 변경)**

`src/shared/api/config.ts` 작성:

```ts
// javascript-obfuscator:disable
import { ENV } from '@/shared/config/env';

const isLive = ENV.BUILD_TYPE === 'live';

function generateGWUrl() {
    switch (ENV.SERVICE_TYPE) {
        case 'wehagom':
            return 'https://api.wehagom.com';
        case 'wehagov':
            return 'https://api.wehagov.com';
        case 'aws':
            return 'https://api.insightofus.ai';
        default:
            return 'https://api.wehago.com';
    }
}

function generateUnCertUrl() {
    switch (ENV.SERVICE_TYPE) {
        case 'wehagom':
            return 'https://api0.wehagom.com';
        case 'wehagov':
            return 'https://api0.wehagov.com';
        case 'aws':
            return 'https://api0.insightofus.ai';
        default:
            return 'https://api0.wehago.com';
    }
}

const apiUrl = isLive ? generateGWUrl() : 'http://dev.api.wehago.com';
const unCertUrl = isLive ? generateUnCertUrl() : 'http://dev.api0.wehago.com';
const objectStorageUrl = apiUrl + '/ObjectStorageCommon/services/common';
const dwUrl = 'https://dwapi.wehago.com';

export { apiUrl, unCertUrl, objectStorageUrl, dwUrl };
```

- [ ] **Step 3: util.ts 이식 + import 경로 갱신**

```bash
cp api_sample/util.ts src/shared/api/util.ts
```

상단 import 블록을 다음으로 교체:

```ts
import axios, { AxiosRequestHeaders } from 'axios';
import CryptoJS from 'crypto-js';

import { unCertUrl } from './config';

import cookieUtil from '@/shared/lib/cookie';
import apiUtil from '@/shared/lib/http';
import browserUtil from '@/shared/lib/browser';
import downloadUtil from '@/shared/lib/download';
```

(나머지 본문 — `createRequestHeader`, `createUncertSignature`, `createEncryptServiceKey`, `downloadFileFromS3`, `wrapPromise` — 원본 그대로 유지.)

- [ ] **Step 4: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/config.ts src/shared/api/types.ts src/shared/api/util.ts
git commit -m "feat(api): port shared api config, types, util"
```

---

## Task 11: src/shared/api/axios 이식

**Files:**
- Create: `src/shared/api/axios/apiControllers.ts`
- Create: `src/shared/api/axios/apiHandlers.ts`

- [ ] **Step 1: 두 파일 복사**

```bash
mkdir -p src/shared/api/axios
cp api_sample/apiControllers.ts src/shared/api/axios/apiControllers.ts
cp api_sample/apiHandlers.ts    src/shared/api/axios/apiHandlers.ts
```

- [ ] **Step 2: apiControllers.ts import 경로 갱신**

상단 import를:

```ts
import axios, { CreateAxiosDefaults } from 'axios';

import { apiUrl, unCertUrl, objectStorageUrl, dwUrl } from '../config';
import { TController } from '../types';
```

(원본의 `'./config'`, `'./types'`를 `'../config'`, `'../types'`로.)

- [ ] **Step 3: apiHandlers.ts import 경로 갱신**

상단 import를:

```ts
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

import { createRequestHeader, createUncertSignature } from '../util';
```

- [ ] **Step 4: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/axios/
git commit -m "feat(api): port axios controllers and handlers"
```

---

## Task 12: src/shared/api/fetch 이식

**Files:**
- Create: `src/shared/api/fetch/{HttpFetchClient,InterceptorManager,apiControllers,apiHandlers,types,index}.ts`

- [ ] **Step 1: 디렉토리 통째 복사**

```bash
mkdir -p src/shared/api/fetch
cp api_sample/fetch-api/HttpFetchClient.ts    src/shared/api/fetch/HttpFetchClient.ts
cp api_sample/fetch-api/InterceptorManager.ts src/shared/api/fetch/InterceptorManager.ts
cp api_sample/fetch-api/apiControllers.ts     src/shared/api/fetch/apiControllers.ts
cp api_sample/fetch-api/apiHandlers.ts        src/shared/api/fetch/apiHandlers.ts
cp api_sample/fetch-api/types.ts              src/shared/api/fetch/types.ts
cp api_sample/fetch-api/index.ts              src/shared/api/fetch/index.ts
```

- [ ] **Step 2: apiControllers.ts import 갱신**

```ts
import { apiUrl, unCertUrl, objectStorageUrl, dwUrl } from '../config';
import { HttpFetchClient } from './HttpFetchClient';

import type { TFetchClientConfig } from './types';
```

(원본의 `'../config'`는 그대로 유지 — 새 위치 기준 동일.)

- [ ] **Step 3: apiHandlers.ts import 갱신**

```ts
import { createRequestHeader, createUncertSignature } from '../util';

import type { InternalFetchRequestConfig, TFetchRequestConfig } from './types';
```

- [ ] **Step 4: HttpFetchClient.ts, InterceptorManager.ts, types.ts, index.ts**

import 외부 의존이 `qs`와 같은 file 내부뿐이라 변경 없음. `qs`는 이미 설치되어 있음.

- [ ] **Step 5: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 6: Commit**

```bash
git add src/shared/api/fetch/
git commit -m "feat(api): port fetch-based controllers"
```

---

## Task 13: src/shared/api/eventSource 이식

**Files:**
- Create: `src/shared/api/eventSource/{eventsource.js,eventsourceController.ts,types.ts,index.ts}`

- [ ] **Step 1: 4개 파일 복사**

```bash
mkdir -p src/shared/api/eventSource
cp api_sample/eventSource/eventsource.js          src/shared/api/eventSource/eventsource.js
cp api_sample/eventSource/eventsourceController.ts src/shared/api/eventSource/eventsourceController.ts
cp api_sample/eventSource/types.ts                 src/shared/api/eventSource/types.ts
cp api_sample/eventSource/index.ts                 src/shared/api/eventSource/index.ts
```

- [ ] **Step 2: eventsourceController.ts import 갱신**

```ts
import { createRequestHeader } from '../util';
import { EventSourcePolyfill } from './eventsource';
import cookieUtil from '@/shared/lib/cookie';

import type {
    IEventSourcePolyfill,
    IEventSourcePolyfillErrorEvent,
    IEventSourcePolyfillMessageEvent,
    IEventSourcePolyfillOpenEvent,
    IEventSourcePolyfillOption,
} from './types';
```

(원본의 `'~common/utils/cookie'`를 `'@/shared/lib/cookie'`로 변경.)

- [ ] **Step 3: eventsource.js 모듈화 보정**

원본 `eventsource.js`는 UMD/IIFE 형태로 `global.EventSourcePolyfill`을 노출한다. TS에서 import 가능하도록 파일 말미에 다음을 추가 (이미 있으면 생략):

```js
// ESM 호환을 위해 export 추가
export const EventSourcePolyfill = (typeof globalThis !== 'undefined' ? globalThis : self).EventSourcePolyfill;
```

원본 파일 확인 후 export가 이미 있다면 step 건너뜀.

- [ ] **Step 4: 모듈 선언 추가 (필요 시)**

`eventsource.js`의 타입이 없어 컴파일 오류가 나면 `src/shared/api/eventSource/eventsource.d.ts`에 한 줄:

```ts
export const EventSourcePolyfill: any;
```

- [ ] **Step 5: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 6: Commit**

```bash
git add src/shared/api/eventSource/
git commit -m "feat(api): port eventSource controller and polyfill"
```

---

## Task 14: examples 작성

**Files:**
- Create: `src/shared/api/examples/{axios-gw,axios-objectStorage,axios-uncert,axios-dw,fetch-gw,eventSource}.example.ts`
- Create: `src/shared/api/examples/{README.md,index.ts}`

- [ ] **Step 1: axios-gw.example.ts**

```ts
// src/shared/api/examples/axios-gw.example.ts
import { createController } from '../axios/apiControllers';
import {
    baseRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const gwExampleController = createController('gw');

gwExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);
gwExampleController.interceptors.response.use(responseHandler, responseErrorHandler);
```

- [ ] **Step 2: axios-objectStorage.example.ts**

```ts
import { createController } from '../axios/apiControllers';
import {
    objectStorageRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const objectStorageExampleController = createController('objectStorage');

objectStorageExampleController.interceptors.request.use(objectStorageRequestHandler, requestErrorHandler);
objectStorageExampleController.interceptors.response.use(responseHandler, responseErrorHandler);
```

- [ ] **Step 3: axios-uncert.example.ts**

```ts
import { createController } from '../axios/apiControllers';
import {
    uncertRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const uncertExampleController = createController('uncert');

uncertExampleController.interceptors.request.use(uncertRequestHandler, requestErrorHandler);
uncertExampleController.interceptors.response.use(responseHandler, responseErrorHandler);
```

- [ ] **Step 4: axios-dw.example.ts**

```ts
import { createController } from '../axios/apiControllers';
import {
    dwRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const dwExampleController = createController('dw');

dwExampleController.interceptors.request.use(dwRequestHandler, requestErrorHandler);
dwExampleController.interceptors.response.use(responseHandler, responseErrorHandler);
```

- [ ] **Step 5: fetch-gw.example.ts**

```ts
import { createController } from '../fetch/apiControllers';
import { baseRequestHandler, requestErrorHandler } from '../fetch/apiHandlers';

export const fetchGwExampleController = createController('gw', {});

fetchGwExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);
```

- [ ] **Step 6: eventSource.example.ts**

```ts
import { eventSourceController } from '../eventSource';

export const createExampleEventSource = (url: string) => {
    const source = eventSourceController(url);
    source.onopen = () => {};
    source.onmessage = () => {};
    source.onerror = () => {};
    return source;
};
```

- [ ] **Step 7: README.md**

```md
# API Controller Examples

| File | Controller | 용도 |
|------|-----------|------|
| axios-gw.example.ts | axios `gw` | 인증 GW 통신 |
| axios-objectStorage.example.ts | axios `objectStorage` | S3 Object Storage |
| axios-uncert.example.ts | axios `uncert` | 비인증 GW |
| axios-dw.example.ts | axios `dw` | DW Open API |
| fetch-gw.example.ts | fetch `gw` | stream/AbortController 활용 시 |
| eventSource.example.ts | EventSource | SSE 수신 |

각 example은 `interceptors.use`까지 등록된 살아있는 인스턴스를 export한다. 서비스에서 사용 시 복사·수정해서 features 레이어로 옮긴다.
```

- [ ] **Step 8: index.ts**

```ts
export * from './axios-gw.example';
export * from './axios-objectStorage.example';
export * from './axios-uncert.example';
export * from './axios-dw.example';
export * from './fetch-gw.example';
export * from './eventSource.example';
```

- [ ] **Step 9: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 10: Commit**

```bash
git add src/shared/api/examples/
git commit -m "feat(api): add controller usage examples"
```

---

## Task 15: src/shared/api/index.ts 진입점 재작성

**Files:**
- Modify: `src/shared/api/index.ts`

- [ ] **Step 1: index.ts 재작성**

```ts
// src/shared/api/index.ts
export * as axiosApi from './axios/apiControllers';
export * as axiosHandlers from './axios/apiHandlers';

export * as fetchApi from './fetch';

export { eventSourceController } from './eventSource';
export type {
    IEventSourcePolyfill,
    IEventSourcePolyfillErrorEvent,
    IEventSourcePolyfillMessageEvent,
    IEventSourcePolyfillOpenEvent,
    IEventSourcePolyfillOption,
} from './eventSource';

export { apiUrl, unCertUrl, objectStorageUrl, dwUrl } from './config';
export type { TController, TRequestHeader } from './types';
export {
    createRequestHeader,
    createUncertSignature,
    downloadFileFromS3,
    wrapPromise,
    createEncryptServiceKey,
} from './util';
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm tsc -b`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add src/shared/api/index.ts
git commit -m "feat(api): rewrite shared/api entry point with namespace exports"
```

---

## Task 16: 기존 client.ts 제거

**Files:**
- Delete: `src/shared/api/client.ts`

- [ ] **Step 1: 외부 참조 재확인**

Run: `rg "from ['\"].*shared/api/client" src/`
Expected: 결과 없음.

- [ ] **Step 2: 파일 삭제**

```bash
rm src/shared/api/client.ts
```

- [ ] **Step 3: 타입 체크 + 테스트**

Run: `pnpm tsc -b && pnpm test --run`
Expected: 0 error, 테스트 모두 PASS.

- [ ] **Step 4: Commit**

```bash
git add -A src/shared/api/client.ts
git commit -m "refactor(api): remove old single-purpose axios client"
```

---

## Task 17: api_sample/ 디렉토리 정리

**Files:**
- Delete: `api_sample/` (디렉토리 전체)

- [ ] **Step 1: 외부 참조 재확인**

Run: `rg "api_sample" src/ config/ docs/ .claude/skills/ -l`
Expected: 결과 없음(인터뷰/스펙/플랜 문서 제외). 결과가 있으면 해당 참조를 정리 후 진행.

- [ ] **Step 2: 디렉토리 삭제**

```bash
rm -rf api_sample
```

- [ ] **Step 3: 빌드 + 테스트 + 린트**

Run: `pnpm lint && pnpm tsc -b && pnpm test --run && pnpm build:dev && pnpm build:prod`
Expected: 모두 통과.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove migrated api_sample directory"
```

---

## Task 18: 최종 검증

**Files:** 없음 (실행만)

- [ ] **Step 1: 풀 검증 명령 실행**

Run:
```bash
pnpm lint
pnpm tsc -b
pnpm test --run
pnpm build:dev
pnpm build:prod
```
Expected: 모두 0 error로 통과.

- [ ] **Step 2: API 노출 검증**

다음 import가 타입체크상 모두 가능한지 확인 (실행할 필요 없음, 임시 파일로 시도 후 삭제):

```ts
import {
    axiosApi,
    axiosHandlers,
    fetchApi,
    eventSourceController,
    apiUrl,
    createRequestHeader,
} from '@/shared/api';

import {
    httpUtil,
    cookieUtil,
    encryptUtil,
    formatUtil,
    regex,
    copyToClipboard,
} from '@/shared/lib';

// 동작 확인용
const gw = axiosApi.createController('gw');
gw.interceptors.request.use(axiosHandlers.baseRequestHandler);
```

타입 체크가 깔끔히 통과하면 진입점 노출 OK.

- [ ] **Step 3: 인터뷰·스펙 문서가 본 작업 흔적과 일관 유지하는지 짧게 검토**

`.claude/plans/interviews/2026-05-12-shared-api-controllers.md`
`.claude/plans/specs/2026-05-12-shared-api-controllers.md`
실제 이식 결과와 차이가 있으면 PR 본문에 명시(문서 자체는 수정하지 않음 — 시점 기록).

- [ ] **Step 4: PR 생성**

브랜치는 `feat/shared-api-controllers` 권장. PR 본문 템플릿(`@git-workflow`)을 채워서 생성. 단일 PR로 모든 변경 포함.

---

## Self-Review

**Spec coverage**

| Spec 결정 | 커버하는 Task |
|---|---|
| 위치 (`shared/api`, `shared/lib`) | T3, T10–T15 |
| 파일명 변경 (api→http, convert→format) | T3 (포함), T6, T7 |
| utils 폴더 평면 + constants/__test__ | T3, T4–T8 |
| eventsource.js 원본 유지 | T13 |
| examples 실제 .ts 모듈 + README | T14 |
| env 스키마 신규 추가 | T2 |
| 테스트 5개 Vitest 변환 (cookie 재작성 포함) | T4–T8 |
| utils export default object 유지 | T3, T9 |
| wehago 인증 로직 그대로 이식 | T10, T11, T13 |
| 단일 PR | T17, T18 (전 task가 동일 브랜치) |
| client.ts 제거 + api_sample/ 정리 | T16, T17 |

빠진 spec 요구사항 없음.

**Placeholder scan**

모든 task에 실제 import 경로·파일 경로·코드·명령이 포함되어 있다. "TBD"·"adjust as needed" 등 미해결 placeholder 없음. eventsource.js의 export 보정(T13 Step 3)은 원본 파일 확인 시점에 한 번만 결정하는 조건부 step으로 명시되어 있고, 결정 기준이 분명하다.

**Type consistency**

- `createController`는 axios·fetch 양쪽에 같은 이름이지만 진입점에서 `axiosApi.createController` / `fetchApi.createController`로 네임스페이스 분리됨(T15).
- `cookieUtil`, `apiUtil`, `browserUtil`, `downloadUtil` import 이름은 `util.ts`(T10), `eventsourceController.ts`(T13)에서 일관 사용.
- `BUILD_TYPE`/`SERVICE_TYPE` 타입은 zod(T2)·ENV(T2)·`config.ts`(T10)에서 동일한 union literal로 정의.
- `regex` namespace는 lib `index.ts`(T9)에서 정의된 형태와 import 시 일관.

---

## 실행 옵션

이 plan은 `subagent-driven-development` 또는 `executing-plans` 중 선택해서 실행한다.

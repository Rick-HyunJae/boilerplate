---
title: API Controllers
description: wehago 인증 API 컨트롤러(axios·fetch·EventSource) 및 공통 유틸리티 사용 가이드
---

# API Controllers

`src/shared/api/`는 wehago 서비스 인증 헤더를 자동으로 주입하는 세 가지 HTTP 클라이언트를 제공한다.  
`src/shared/lib/`는 서비스 전반에서 사용하는 유틸리티 12개를 제공한다.

---

## 디렉토리 구조

```
src/shared/api/
├── axios/                   # axios 기반 컨트롤러
│   ├── apiControllers.ts    # createController() 팩토리
│   └── apiHandlers.ts       # 인터셉터 핸들러
├── fetch/                   # fetch 기반 컨트롤러
│   ├── HttpFetchClient.ts   # fetch 클라이언트 클래스
│   ├── InterceptorManager.ts
│   ├── apiControllers.ts
│   ├── apiHandlers.ts
│   ├── types.ts
│   └── index.ts
├── eventSource/             # SSE 컨트롤러
│   ├── eventsource.js       # Yaffle EventSource 폴리필
│   ├── eventsourceController.ts
│   ├── types.ts
│   └── index.ts
├── examples/                # 사용 예시 (복사 후 features로 이동)
│   ├── axios-gw.example.ts
│   ├── axios-objectStorage.example.ts
│   ├── axios-uncert.example.ts
│   ├── axios-dw.example.ts
│   ├── fetch-gw.example.ts
│   ├── eventSource.example.ts
│   ├── README.md
│   └── index.ts
├── config.ts                # 환경별 도메인 URL
├── types.ts                 # TController, TRequestHeader
├── util.ts                  # createRequestHeader 등
└── index.ts                 # 진입점

src/shared/lib/
├── http.ts                  # getTransactionId, getLocation, getTimestamp
├── format.ts                # 숫자·문자열 포맷 변환
├── browser.ts               # 브라우저 감지
├── color.ts                 # 색상 유틸
├── console.ts               # 커스텀 로깅
├── cookie.ts                # setCookie, getCookie, removeCookie
├── copy.ts                  # copyToClipboard
├── date.ts                  # 날짜 포맷
├── download.ts              # 파일 다운로드
├── encrypt.ts               # AES 암·복호화
├── fullScreen.ts            # 전체화면 제어
├── math.ts                  # 부동소수점 연산
├── constants/regex.ts       # 공통 정규식
└── index.ts                 # 진입점
```

---

## 컨트롤러 타입

두 컨트롤러(axios, fetch) 모두 동일한 5가지 타입을 지원한다.

| 타입 | 대상 | baseURL |
|---|---|---|
| `basic` | 임의 엔드포인트 | 직접 지정 |
| `gw` | wehago 인증 GW | `ENV.BUILD_TYPE`에 따라 결정 |
| `objectStorage` | S3 Object Storage | GW URL + `/ObjectStorageCommon/services/common` |
| `uncert` | 비인증 GW (signature 방식) | `ENV.BUILD_TYPE`에 따라 결정 |
| `dw` | DW Open API | `https://dwapi.wehago.com` (고정) |

---

## 환경 설정

`config/env/.env.dev` / `config/env/.env.prod`에 아래 두 값을 지정한다.

```env
VITE_BUILD_TYPE=dev          # dev | live
VITE_SERVICE_TYPE=wehago     # wehago | wehagom | wehagov | aws
```

| `BUILD_TYPE` | GW URL |
|---|---|
| `dev` | `http://dev.api.wehago.com` |
| `live` | `SERVICE_TYPE`에 따라 분기 |

| `SERVICE_TYPE` (live 시) | GW URL |
|---|---|
| `wehago` (기본) | `https://api.wehago.com` |
| `wehagom` | `https://api.wehagom.com` |
| `wehagov` | `https://api.wehagov.com` |
| `aws` | `https://api.insightofus.ai` |

---

## axios 컨트롤러

### 기본 사용 패턴

features 레이어에서 컨트롤러를 생성하고 인터셉터를 등록한다.

```ts
// features/some-feature/api/client.ts
import { axiosApi, axiosHandlers } from '@/shared/api';

export const apiClient = axiosApi.createController('gw');

apiClient.interceptors.request.use(
    axiosHandlers.baseRequestHandler,
    axiosHandlers.requestErrorHandler,
);
apiClient.interceptors.response.use(
    axiosHandlers.responseHandler,
    axiosHandlers.responseErrorHandler,
);
```

### 컨트롤러별 핸들러 매핑

| 타입 | request handler | response handler |
|---|---|---|
| `gw` | `baseRequestHandler` | `responseHandler` |
| `objectStorage` | `objectStorageRequestHandler` | `responseHandler` |
| `uncert` | `uncertRequestHandler` | `responseHandler` |
| `dw` | `dwRequestHandler` | `responseHandler` |

에러 핸들러는 공통으로 `requestErrorHandler` / `responseErrorHandler`를 사용한다.

### baseURL 오버라이드

```ts
const client = axiosApi.createController('gw', {
    baseURL: 'https://custom.api.wehago.com',
    timeout: 30000,
});
```

---

## fetch 컨트롤러

axios와 동일한 `createController` API를 제공하지만 두 가지 차이가 있다.

1. **response 인터셉터 없음** — request 인터셉터만 지원한다. (설계 의도)
2. **`AbortController` 기반 타임아웃** — axios의 `timeout` 옵션 대신 직접 처리.

```ts
// features/some-feature/api/client.ts
import { fetchApi } from '@/shared/api';

export const fetchClient = fetchApi.createController('gw');

fetchClient.interceptors.request.use(
    fetchApi.baseRequestHandler,
    fetchApi.requestErrorHandler,
);
```

### fetch 컨트롤러 직접 호출

```ts
const response = await fetchClient.get<MyType>('/api/endpoint', {
    params: { id: 1 },
});
```

axios와 달리 `response.data`가 아닌 응답 객체가 직접 반환된다. 타입은 `TFetchClientConfig`를 참고한다.

---

## EventSource 컨트롤러

SSE(Server-Sent Events) 연결에 사용한다. wehago 인증 헤더가 자동으로 포함된다.

```ts
import { eventSourceController } from '@/shared/api';

const source = eventSourceController('https://api.wehago.com/sse/stream');

source.onopen = (event) => {
    console.log('connected', event);
};
source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // 데이터 처리
};
source.onerror = (event) => {
    console.error('SSE error', event.status);
    source.close();
};

// 연결 종료
source.close();
```

### options

```ts
eventSourceController(url, {
    withCredentials: true,   // 쿠키 포함 여부 (기본 true)
    headers: {               // 추가 헤더 (wehago 기본 헤더에 병합)
        'X-Custom': 'value',
    },
});
```

---

## 예시 파일 활용

`src/shared/api/examples/`에는 각 타입별로 인터셉터까지 등록된 살아있는 인스턴스가 있다.  
**직접 import하지 말고, 복사해서 features 레이어로 이동한 뒤 수정한다.**

```
src/shared/api/examples/axios-gw.example.ts   →   복사
src/features/dashboard/api/client.ts           ←   붙여넣고 수정
```

---

## 공통 유틸리티 (`@/shared/lib`)

```ts
import {
    httpUtil,      // getTransactionId, getLocation, getTimestamp
    formatUtil,    // convertPriceToComma, convertCommaToPrice, convertEncodingTextToText
    browserUtil,   // detectBrowser, isMobile 등
    colorUtil,     // hex ↔ rgb 변환
    consoleUtil,   // 커스텀 콘솔 래퍼
    cookieUtil,    // setCookie, getCookie, removeCookie, getLatestCookie
    dateUtil,      // 날짜 포맷 함수
    downloadUtil,  // 파일 다운로드 트리거
    encryptUtil,   // aesEncrypt, aesDecrypt
    fullScreenUtil,// 전체화면 진입·해제
    mathUtil,      // mathRoundDecimalValue, floatOperation
    copyToClipboard,
    regex,         // locationReg, addCommaReg, koreanReg 등
} from '@/shared/lib';
```

### 자주 쓰는 유틸 예시

**쿠키**
```ts
import { cookieUtil } from '@/shared/lib';

cookieUtil.setCookie('token', value, 7, 'wehago.com');
const token = cookieUtil.getCookie('token');
cookieUtil.removeCookie('token', 'wehago.com');
```

**숫자 포맷**
```ts
import { formatUtil } from '@/shared/lib';

formatUtil.convertPriceToComma(1234567);   // '1,234,567'
formatUtil.convertCommaToPrice('1,234,567'); // 1234567
```

**AES 암호화**
```ts
import { encryptUtil } from '@/shared/lib';

const encrypted = encryptUtil.aesEncrypt('plaintext', secretKey);
// { salt: '...', value: '...' } | undefined

const decrypted = encryptUtil.aesDecrypt(encrypted.value, secretKey);
// 'plaintext' | ''
```

**클립보드**
```ts
import { copyToClipboard } from '@/shared/lib';

await copyToClipboard('복사할 텍스트');
```

---

## FSD 배치 규칙

| 코드 | 위치 |
|---|---|
| API 클라이언트 인스턴스 생성 + 인터셉터 등록 | `features/{feature}/api/` |
| 특정 API 호출 함수 | `features/{feature}/api/` |
| 여러 feature가 공유하는 API 호출 | `entities/{entity}/api/` |
| 컨트롤러 팩토리, 핸들러, 유틸 | `shared/api/` (수정 금지) |
| 유틸리티 함수 | `shared/lib/` (수정 금지) |

`shared/api/`와 `shared/lib/`는 **wehago 인프라 레이어**다. 비즈니스 로직을 넣지 않는다.

---

## 주의 사항

**환경변수 직접 접근 금지**

```ts
// ❌
const url = process.env.VITE_BUILD_TYPE === 'live' ? '...' : '...';

// ✅
import { ENV } from '@/shared/config/env';
const url = ENV.BUILD_TYPE === 'live' ? '...' : '...';
```

**컨트롤러 인스턴스는 모듈 레벨에서 생성**

```ts
// ✅ — 모듈 초기화 시 한 번만 생성
export const apiClient = axiosApi.createController('gw');
apiClient.interceptors.request.use(axiosHandlers.baseRequestHandler);

// ❌ — 매 호출마다 새 인스턴스 생성
export function fetchData() {
    const client = axiosApi.createController('gw');
    return client.get('/data');
}
```

**fetch 컨트롤러는 response 인터셉터를 지원하지 않는다**

응답 후처리(에러 코드 파싱, 토큰 갱신)가 필요하면 axios 컨트롤러를 사용한다.

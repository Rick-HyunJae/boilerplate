# Interview: shared-api-controllers

**Date:** 2026-05-12
**Source request:** `@api_sample/` 코드를 분석하고 현재 프로젝트의 공통 API 컨트롤러로 적용하기 위한 방안을 제안.

## 목표

`api_sample/`(axios 기반 컨트롤러 + fetch 기반 컨트롤러 + EventSource 컨트롤러 + utils + wehago 전용 인증 로직)을 현재 React 19 + TypeScript + FSD 보일러플레이트의 공통 API 레이어로 **그대로 이식**한다. 기존 단순 `src/shared/api/client.ts`는 wehago 인증 컨트롤러로 대체된다. 프로젝트 내에서 axios / fetch / SSE 중 필요한 컨트롤러를 선택적으로 사용할 수 있도록 한다.

## 범위

### 포함

- **컨트롤러 3종 이식** (모두 `src/shared/api/` 하위, 타입별 폴더 분리)
  - `src/shared/api/axios/` ← `api_sample/apiControllers.ts`, `apiHandlers.ts`
  - `src/shared/api/fetch/` ← `api_sample/fetch-api/*` (HttpFetchClient, InterceptorManager, apiControllers, apiHandlers, types, index)
  - `src/shared/api/eventSource/` ← `api_sample/eventSource/*` (eventsource.js, eventsourceController.ts, types.ts, index.ts)
- **공용 자산** — `src/shared/api/` 루트에 `config.ts`, `types.ts`, `util.ts`, `index.ts` 배치
- **utils 12개 + 테스트 이식** — `api_sample/utils/{api,browser,color,console,convert,cookie,copy,date,download,encrypt,fullScreen,fullScreen,math}.ts` + `__test__/*.test.ts` → `src/shared/lib/` 하위
- **예시 코드** — `src/shared/api/examples/` 에 axios/fetch/eventSource 각 컨트롤러의 인터셉터 등록·호출 예시 작성
- **wehago 인증 로직 유지** — wehago-sign · transactionId · timestamp · cno · Authorization(Bearer) 등 헤더 자동 주입과 CryptoJS 기반 signature 생성 로직 그대로 유지
- **환경변수 통합** — `config.ts`의 `process.env.BUILD_TYPE` / `SERVICE_TYPE` 참조를 프로젝트 규칙(`.claude/rules/env.md`)에 맞춰 재구성:
  1. `config/env/index.ts` zod 스키마에 `VITE_BUILD_TYPE`, `VITE_SERVICE_TYPE` 추가
  2. `src/shared/config/env.ts` `ENV` 객체에 `BUILD_TYPE`, `SERVICE_TYPE` 노출
  3. `.env.dev` / `.env.prod` 에 실제 값 추가
  4. `src/shared/api/config.ts` 는 `ENV` 객체를 통해 도메인 분기
- **의존성 추가** — `crypto-js`, `qs`, `event-source-polyfill`(eventsource.js 사용 패턴 확인 후 필요시) 및 타입 패키지
- **기존 `src/shared/api/client.ts` 제거** (외부 사용처 없음 확인 — grep 결과 `client.ts` ↔ `index.ts` 두 파일만)
- **`src/shared/lib/index.ts` 갱신** — 이식된 utils re-export
- **테스트 인프라 정합** — utils 테스트가 현재 Vitest 환경에서 통과하도록 import 경로/설정 조정
- **이식 완료 후 `api_sample/` 디렉토리 삭제 또는 정리** (마이그레이션 흔적 제거)

### 제외

- wehago 인증 로직의 추상화/일반화 (그대로 이식 결정)
- 컨트롤러 사용처(features/entities) 실제 적용 — 본 작업은 공통 레이어 이식까지
- `downloadFileFromS3` 등 보조 함수의 동작 검증을 위한 실제 S3 환경 연동
- 새로운 컨트롤러 타입 추가 (basic/gw/objectStorage/uncert/dw 5종 유지)
- response interceptor 일반화 (fetch 구현은 의도적으로 request만 지원하는 원본 설계 유지)

## 제약

- **FSD 레이어 규칙** — 모든 코드는 `src/shared/` 하위. 의존 방향 위반 금지.
- **env 규칙** — 런타임 코드에서 `import.meta.env` 직접 참조 금지. `ENV` 객체 경유 필수.
- **TypeScript strict** — 기존 코드 스타일 유지하되 strict 컴파일 통과 필요.
- **테스트 — Vitest 환경** — `api_sample/utils/__test__/`의 테스트가 그대로 통과해야 함.
- **import 경로** — `~common/utils/*` 같은 wehago 원본 alias 제거, `@/shared/lib/*` 등 현재 프로젝트 alias로 치환.
- **pnpm 사용** — 의존성 추가는 pnpm 사용.

## 완료 기준

1. `src/shared/api/{axios,fetch,eventSource,examples}/` 모듈이 존재하고 각각 컨트롤러를 export.
2. `createController('basic' | 'gw' | 'objectStorage' | 'uncert' | 'dw', options)` 가 axios/fetch 양쪽에서 동작.
3. `eventSourceController(url, options)` 가 정상 인스턴스 생성.
4. `src/shared/lib/` 에 utils 12개와 테스트가 이식되고 `pnpm test` 통과.
5. `pnpm lint`, `pnpm build:dev`, `pnpm build:prod` 모두 통과.
6. `config/env/index.ts` zod 스키마, `src/shared/config/env.ts` ENV, `.env.dev`/`.env.prod` 에 `VITE_BUILD_TYPE`/`VITE_SERVICE_TYPE` 정의.
7. `src/shared/api/examples/` 에 컨트롤러별 인터셉터 등록·호출 샘플 존재.
8. `src/shared/api/client.ts` 가 제거되었고 외부 참조 없음.
9. `api_sample/` 가 정리됨.

## 열린 질문

- `event-source-polyfill` 패키지 vs `api_sample/eventSource/eventsource.js` 원본 유지 — 이식 시 어느 쪽을 쓸지 (구현 시점에 eventsource.js 내용을 보고 결정).
- `VITE_BUILD_TYPE` / `VITE_APP_MODE`가 의미상 겹침 — 통합할지 병존할지 (실 구현 시 결정, 기본은 병존하여 원본 로직 그대로 이식).
- `examples/` 의 구체적 형태 — 단순 코드 스니펫(.md or .ts.example) vs 실제 TS 모듈 (실 구현 시 결정).
- utils 테스트 중 wehago 환경 의존성이 있는 것(api.test.ts, cookie.test.ts, encrypt.test.ts)의 mock 전략 (구현 시 테스트 코드 확인 후 결정).

## 추천 다음 단계

- [x] **brainstorming** (설계가 필요한 경우)
- [ ] writing-plans

**근거:** 이식 결정은 모두 내려졌지만, 실제 구현은 (1) FSD 경계에서 utils 재배치 카테고리 분류, (2) env 스키마 변경의 파급 효과(빌드/도커/CI), (3) examples 형태, (4) wehago utils 테스트의 mocking 전략 등 설계 결정이 여러 갈래로 열려 있다. brainstorming으로 한 차례 옵션을 펼친 뒤 writing-plans로 넘기는 것을 권장한다. (이식 자체가 단순 복사라면 writing-plans 직행도 가능.)

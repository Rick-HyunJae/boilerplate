# 09. 기능 동등성 검증 체크리스트

빌드 시스템 구축 완료 후, 아래 8개 기능이 모두 정상 동작하는지 확인.

---

## 사전 준비

```bash
# 의존성 설치 확인
node -v   # >= 20.x
npm -v    # >= 10.x

# 빌드 도구 설치 확인
npx <tool> --version  # vite / rollup / esbuild 등
```

---

## 1. 환경 관리 검증

```bash
# dev 환경으로 빌드
cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago npm run build

# live 환경으로 빌드  
cross-env BUILD_TYPE=live SERVICE_TYPE=wehago npm run build
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| `process.env.BUILD_TYPE` | 브라우저 콘솔에서 `process.env.BUILD_TYPE` 확인 | `'dev'` 또는 `'live'` 출력 |
| `process.env.SERVICE_TYPE` | 브라우저 콘솔에서 `process.env.SERVICE_TYPE` 확인 | `'wehago'` 또는 `'wehagom'` 출력 |
| HTML 변수 치환 | 빌드된 `index.html` 열어서 `%STATIC_LINK%` 문자열 검색 | 문자열이 남아있지 않고 실제 URL로 치환됨 |
| 환경별 URL 분기 | dev 빌드와 live 빌드의 STATIC_LINK 비교 | dev: 내부 IP, live: `static.wehago.com` |

---

## 2. 모듈 해석 (alias) 검증

```ts
// 테스트 코드: alias가 동작하는지 확인
import { something } from '~components/Something';
import { utils } from '~utils/format';
import styles from '~css/main.css';
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| 빌드 성공 여부 | `npm run build` 실행 | 에러 없이 빌드 완료 |
| alias 해석 | 빌드 결과물에서 `~components` 문자열 검색 | 실제 경로로 변환됨 |
| TypeScript 타입 검사 | `npx tsc --noEmit` | 타입 오류 없음 |
| IDE 자동완성 | VS Code에서 `~components/` 입력 후 자동완성 | 파일 목록이 나타남 |

---

## 3. 소스 변환 검증

```bash
# TypeScript 오류 없이 빌드
npm run build
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| TS/TSX 컴파일 | `.tsx` 파일 포함 빌드 | 에러 없이 번들 생성 |
| CSS Modules | `.module.css` 파일 import 후 빌드 | 해시된 클래스명 생성됨 |
| SCSS 처리 | `.scss` 파일 import 후 빌드 | 에러 없이 CSS 변환됨 |
| HTML 진입점 | 빌드된 `dist/index.html` 열기 | JS/CSS 파일이 자동 삽입됨 |
| React Fast Refresh | dev server 실행 후 컴포넌트 수정 | state 보존하며 즉시 반영 |

---

## 4. 자산 처리 검증

```ts
// 이미지/폰트 import 테스트
import logo from '~images/logo.svg';
import font from '~css/fonts/NotoSansKR.woff2';
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| 이미지 인라인 (10KB 이하) | 10KB 이하 PNG import | 빌드 산출물에 base64 포함 |
| 이미지 파일 추출 (10KB 초과) | 10KB 초과 PNG import | `static/image/` 디렉토리에 파일 생성 |
| 폰트 처리 | `.woff2` import | 빌드 산출물에 폰트 파일 포함 |
| JSON import | `.json` 파일 import | 데이터가 JS 객체로 변환됨 |
| SVG 처리 | `.svg` import | 이미지로 사용 가능 (또는 React 컴포넌트로) |

---

## 5. 빌드 산출물 검증

```bash
npm run build:dev   # 개발 빌드
npm run build:prod  # 운영 빌드
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| 개발 빌드 파일명 | `build/` 디렉토리 확인 | `[name].bundle.js` (hash 없음) |
| 운영 빌드 파일명 | `build/js/` 디렉토리 확인 | `[name].[hash].bundle.js` (10자리 hash) |
| CSS 파일 추출 | `build/styles/` 디렉토리 확인 | `.css` 파일 생성됨 |
| chunk 분리 | `build/js/` 내 여러 파일 | `vendor-*` 청크 파일 존재 |
| 소스맵 (dev) | `build/` 내 `.map` 파일 | 소스맵 파일 존재 |
| 소스맵 (live) | live 빌드의 `build/` | `.map` 파일 없음 |
| 이전 빌드 정리 | 빌드 전 임의 파일을 `build/`에 추가 후 재빌드 | 임의 파일이 삭제됨 |

---

## 6. 개발 서버 검증

```bash
npm run dev         # 기본 dev 서버
npm run dev:prod    # HTTPS dev 서버
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| 서버 시작 | `npm run dev` | 포트 3000에서 서버 시작 |
| HMR 동작 | JS 파일 수정 | 브라우저 새로고침 없이 반영 |
| CSS HMR | CSS 파일 수정 | 페이지 리로드 없이 스타일 변경 |
| 정적 파일 | `public/` 디렉토리 파일 접근 | 직접 URL로 접근 가능 |
| SPA 라우팅 | 직접 URL 입력 (`/about`, `/dashboard` 등) | 404 대신 앱이 로드됨 |
| HTTPS 모드 | `npm run dev:prod` 실행 | `https://` URL로 접속 가능 |

---

## 7. 성능 최적화 검증

```bash
# 운영 빌드 후 번들 크기 분석
npm run build:prod
ls -lh build/js/  # 파일 크기 확인
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| JS minify | 빌드된 `.js` 파일 열기 | 공백/주석 없이 압축됨 |
| CSS minify | 빌드된 `.css` 파일 열기 | 압축된 CSS |
| tree shaking | 사용 안 하는 export 추가 후 빌드 | 번들에 포함 안 됨 (bundle analyzer 활용) |
| 코드 분할 | `build/js/` 확인 | 여러 청크 파일 존재 |
| 빌드 캐시 | 동일 빌드 2회 실행 시간 비교 | 2회째가 빠름 |

---

## 8. 난독화 검증

```bash
# 운영 빌드 (난독화 포함)
cross-env NODE_ENV=production BUILD_TYPE=live npm run build
```

| 항목 | 확인 방법 | 기대 결과 |
|------|---------|---------|
| 난독화 적용 여부 | 빌드된 api 관련 파일 열기 | `_0x1234`, `[]()` 등 난독화된 코드 확인 |
| 비대상 파일 비난독화 | 다른 파일 열기 | 일반 minified 코드 (가독성 있음) |
| 개발 환경 비적용 | `npm run dev` 후 소스 확인 | 원본 코드 유지 |
| 난독화 후 동작 | 브라우저에서 앱 전체 동작 확인 | 모든 기능 정상 동작 |
| API 호출 동작 | 난독화된 api 레이어로 실제 API 호출 | 정상 응답 수신 |

---

## 최종 확인 사항

```bash
# 빌드 아티팩트 검토
find build -type f | sort
```

| 최종 항목 | 기대 상태 |
|---------|---------|
| `build/index.html` | 존재, JS/CSS 경로 정상 |
| `build/js/*.bundle.js` | 존재, minified |
| `build/styles/*.css` | 존재, minified |
| `build/static/` | 자산 파일 포함 |
| 빌드 산출물 전체 용량 | 이전 빌드 대비 비슷하거나 작음 |
| 브라우저 콘솔 오류 | 없음 |
| 네트워크 탭 404 | 없음 |

# 01. 환경 관리 (Environment Management)

## 1. 요구사항

### 해결해야 할 문제
- 개발(dev) / 스테이징 / 운영(live) 등 다수의 배포 환경을 하나의 코드베이스로 관리
- 환경변수를 JavaScript 번들과 HTML 템플릿 양쪽에 주입
- 서비스 타입(예: wehago, wehagom)에 따라 외부 CDN 링크, base component 경로를 동적으로 변경

### 프로젝트 특화 요구사항
- `NODE_ENV` × `BUILD_TYPE`(dev/live) × `SERVICE_TYPE`(wehago/wehagom) 3축 조합으로 환경 분기
- JS에는 `process.env.VARIABLE` 형태로 주입
- HTML 템플릿에는 `%VARIABLE_NAME%` 패턴으로 치환
- 환경별 캐시 키 분리: `PRODUCTION_WEHAGO_LIVE_20260126` 형태

---

## 2. 현재 webpack 구현

### 사용 패키지
```
dotenv (환경변수 파일 로딩)
webpack.DefinePlugin (JS 주입)
interpolate-html-plugin (HTML 치환)
```

### 핵심 구조
```js
// 환경 분기 키
const BUILD_TYPE = process.env.BUILD_TYPE;    // 'dev' | 'live'
const SERVICE_TYPE = process.env.SERVICE_TYPE; // 'wehago' | 'wehagom'
const NODE_ENV = process.env.NODE_ENV;         // 'development' | 'production'

// dotenv + process.env 병합
const rawEnv = { ...process.env, ...dotenv.config().parsed };

// 서비스별 외부 리소스 링크 동적 생성
function getStaticLink(buildType, serviceType) {
  if (buildType === 'live') {
    return serviceType === 'wehagom'
      ? 'https://static.wehagov.com'
      : 'https://static.wehago.com';
  }
  return 'http://172.16.114.131'; // 내부 dev 서버
}

// JS에 주입 (webpack.DefinePlugin)
new webpack.DefinePlugin({
  'process.env': Object.fromEntries(
    Object.entries(rawEnv).map(([k, v]) => [k, JSON.stringify(v)])
  )
})

// HTML에 주입 (InterpolateHtmlPlugin)
// index.html에서 %STATIC_LINK%, %SERVICE_TYPE% 등으로 참조
new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
  STATIC_LINK: getStaticLink(BUILD_TYPE, SERVICE_TYPE),
  SERVICE_TYPE,
  BUILD_TYPE,
})
```

### 환경변수 파일 구조
```
.env                   # 공통 기본값
.env.development       # 개발 환경 override
.env.production        # 운영 환경 override
```

---

## 3. 빌드 도구별 구현 방식

### vite

**필요 패키지**: 추가 패키지 없음 (dotenv는 vite가 자동 처리)

**설치**:
```bash
npm i -D vite @vitejs/plugin-react
```

**vite.config.ts**:
```ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
  // mode = 'development' | 'production' | 커스텀 모드
  const env = loadEnv(mode, process.cwd(), '');
  const BUILD_TYPE = env.BUILD_TYPE ?? 'dev';
  const SERVICE_TYPE = env.SERVICE_TYPE ?? 'wehago';

  return {
    define: {
      // process.env.X 형태로 코드에서 사용 가능
      'process.env.BUILD_TYPE': JSON.stringify(BUILD_TYPE),
      'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.STATIC_LINK': JSON.stringify(getStaticLink(BUILD_TYPE, SERVICE_TYPE)),
    },
    // HTML의 %ENV_VAR% 패턴은 vite가 import.meta.env.VITE_* 변수를 native 지원
    // process.env 스타일 유지 원할 경우 위 define 방식 사용
  };
});
```

**HTML 변수 치환**:
- `.env` 파일에서 `VITE_` 접두사가 붙은 변수는 HTML에서 `%VITE_VAR_NAME%`으로 자동 치환
- 접두사 없이 쓰려면 `vite-plugin-html`을 사용:
```bash
npm i -D vite-plugin-html
```
```ts
import { createHtmlPlugin } from 'vite-plugin-html';

createHtmlPlugin({
  inject: {
    data: {
      STATIC_LINK: getStaticLink(BUILD_TYPE, SERVICE_TYPE),
      SERVICE_TYPE,
    }
  }
})
```

**npm scripts (package.json)**:
```json
"scripts": {
  "dev": "cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago vite",
  "build:dev": "cross-env NODE_ENV=production BUILD_TYPE=dev SERVICE_TYPE=wehago vite build",
  "build:prod": "cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehago vite build",
  "build:wehagom": "cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehagom vite build"
}
```

---

### rollup

**필요 패키지**:
```bash
npm i -D rollup @rollup/plugin-replace dotenv cross-env
```

**rollup.config.mjs**:
```js
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

const env = { ...dotenv.config().parsed, ...process.env };
const BUILD_TYPE = env.BUILD_TYPE ?? 'dev';
const SERVICE_TYPE = env.SERVICE_TYPE ?? 'wehago';

export default {
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.BUILD_TYPE': JSON.stringify(BUILD_TYPE),
        'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        'process.env.STATIC_LINK': JSON.stringify(getStaticLink(BUILD_TYPE, SERVICE_TYPE)),
      }
    })
  ]
};
```

**HTML 변수 치환**: rollup에는 native 지원 없음.
```bash
npm i -D @rollup/plugin-html
```
또는 빌드 후 별도 스크립트로 HTML 파일의 `%VAR%` 패턴을 치환.

---

### esbuild

**필요 패키지**:
```bash
npm i -D esbuild dotenv cross-env
```

**esbuild.config.mjs**:
```js
import { build } from 'esbuild';
import dotenv from 'dotenv';

const env = { ...dotenv.config().parsed, ...process.env };
const BUILD_TYPE = env.BUILD_TYPE ?? 'dev';
const SERVICE_TYPE = env.SERVICE_TYPE ?? 'wehago';

await build({
  define: {
    'process.env.BUILD_TYPE': JSON.stringify(BUILD_TYPE),
    'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'process.env.STATIC_LINK': JSON.stringify(getStaticLink(BUILD_TYPE, SERVICE_TYPE)),
  }
});
```

**HTML 변수 치환**: native 미지원. 빌드 후 별도 스크립트 필요:
```js
// scripts/inject-env.mjs
import fs from 'fs';
const html = fs.readFileSync('dist/index.html', 'utf-8');
const result = html
  .replace(/%STATIC_LINK%/g, getStaticLink(BUILD_TYPE, SERVICE_TYPE))
  .replace(/%SERVICE_TYPE%/g, SERVICE_TYPE);
fs.writeFileSync('dist/index.html', result);
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### 공통
- `cross-env` 설치 필수 (Windows 호환)
- `.env` 파일은 버전 관리 제외 (`.gitignore`에 추가)
- `process.env.X` 참조 코드가 있다면 `define` 방식으로 처리 (브라우저는 process.env 미지원)

### 서비스 타입 추가 시
- 새 SERVICE_TYPE 추가 = `getStaticLink()` 함수 수정 + npm 스크립트 추가
- HTML 템플릿도 SERVICE_TYPE별로 별도 파일 사용 가능 (vite: `build.rollupOptions.input`)

### vite 특이사항
- `import.meta.env.MODE`: vite의 현재 mode 값 (development/production)
- `VITE_` 접두사 없는 환경변수는 클라이언트에 노출되지 않음 → `define`으로 명시적 주입 필요

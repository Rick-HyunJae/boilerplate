# 06. 개발 서버 (Dev Server)

## 1. 요구사항

### 해결해야 할 문제
- 소스 변경 시 브라우저 자동 반영 (HMR)
- React 컴포넌트 상태 보존 Fast Refresh
- HTTPS 지원 (특정 환경에서 필수)
- 동적 host/port 설정 (서비스 타입별 다른 도메인)
- 정적 파일 서빙 (`/public` 디렉토리)

### 프로젝트 특화 요구사항
- **기본 포트**: 3000
- **기본 호스트**: `test.wehago.com`
- **HTTPS**: `BUILD_TYPE=live`일 때 활성화
- **wehagom 서비스**: HOST를 `test.samsunghospital.com`으로 변경

---

## 2. 현재 webpack 구현

### 사용 패키지
```
webpack-dev-server
@pmmmwh/react-refresh-webpack-plugin
react-refresh
```

### 핵심 구조
```js
// webpack.dev.js
const isHttps = process.env.HTTPS === 'true';
const host = process.env.HOST || 'test.wehago.com';
const port = process.env.DEFAULT_PORT || 3000;

module.exports = {
  devServer: {
    compress: true,
    hot: true,                         // HMR 활성화
    historyApiFallback: true,          // SPA 라우팅 지원
    port,
    host,
    open: isHttps,                     // HTTPS 시 브라우저 자동 열기
    server: isHttps ? 'https' : 'http',
    static: {
      directory: path.resolve('public'),
      publicPath: '/',
    },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),   // React Fast Refresh
  ],
};
```

**npm scripts**:
```json
"start:dev":    "cross-env NODE_ENV=development BUILD_TYPE=dev SERVICE_TYPE=wehago webpack serve",
"start:prod":   "cross-env HTTPS=true BUILD_TYPE=live SERVICE_TYPE=wehago webpack serve",
"start:wehagom":"cross-env HOST=test.samsunghospital.com BUILD_TYPE=live SERVICE_TYPE=wehagom webpack serve"
```

---

## 3. 빌드 도구별 구현 방식

### vite (단독, 권장)

vite는 dev server가 내장이며 8개 기능 중 dev server 지원이 가장 완성도 높음.

**필요 패키지**:
```bash
npm i -D vite @vitejs/plugin-react
```

**vite.config.ts**:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isHttps = process.env.HTTPS === 'true';
const host = process.env.HOST || 'test.wehago.com';
const port = Number(process.env.DEFAULT_PORT) || 3000;

export default defineConfig({
  plugins: [
    react(), // React Fast Refresh 자동 포함
  ],
  server: {
    port,
    host,                              // 모든 인터페이스에서 접근 허용
    https: isHttps,
    open: isHttps,
    historyApiFallback: true,          // SPA 라우팅 (vite에서는 자동)
    // 정적 파일 서빙 (public 디렉토리는 vite가 자동 서빙)

    // proxy 설정 (API 서버 연동 시)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  // public 디렉토리 (기본값: 'public')
  publicDir: 'public',
});
```

**npm scripts**:
```json
"scripts": {
  "dev": "cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago vite",
  "dev:prod": "cross-env HTTPS=true BUILD_TYPE=live SERVICE_TYPE=wehago vite",
  "dev:wehagom": "cross-env HOST=test.samsunghospital.com BUILD_TYPE=live SERVICE_TYPE=wehagom vite"
}
```

---

### rollup + vite dev (검증된 조합)

rollup은 자체 dev server가 약하므로 **vite를 dev server로 사용**하고, build만 rollup으로 처리.

**원리**: vite의 build engine이 이미 rollup이므로 rollup 설정 개념이 공유됨.

**필요 패키지**:
```bash
npm i -D vite @vitejs/plugin-react rollup
```

**vite.config.ts** (dev server용):
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: process.env.HOST || 'test.wehago.com',
    https: process.env.HTTPS === 'true',
  },
  // vite dev는 rollup config를 직접 읽지 않음
  // 개발 환경 alias 등은 vite.config.ts에 따로 설정 필요
});
```

**npm scripts**:
```json
"scripts": {
  "dev": "cross-env BUILD_TYPE=dev vite",
  "build": "cross-env NODE_ENV=production rollup --config rollup.config.mjs"
}
```

> 주의: vite dev와 rollup build의 설정이 분리되므로, alias/환경변수 등을
> 두 파일에 모두 동기화해야 함. 공통 설정 객체를 별도 파일로 추출 권장.

---

### esbuild + vite dev (검증된 조합)

esbuild도 동일하게 vite를 dev server로 사용.

**원리**: vite가 내부적으로 esbuild를 사용하므로(TS 변환, 의존성 사전번들) 설정 개념이 공유됨.

**필요 패키지**:
```bash
npm i -D vite @vitejs/plugin-react esbuild
```

**npm scripts**:
```json
"scripts": {
  "dev": "cross-env BUILD_TYPE=dev vite",
  "build": "cross-env NODE_ENV=production node esbuild.config.mjs"
}
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### historyApiFallback (SPA 라우팅)
- React Router 등 클라이언트 사이드 라우팅 사용 시 필수
- 모든 경로에서 `index.html`을 반환해야 함
- **vite**: 자동 처리 (별도 설정 불필요)
- **webpack-dev-server**: `historyApiFallback: true`
- **rollup/esbuild 단독**: 별도 설정 필요 (vite 조합 권장 이유)

### HTTPS 인증서
- 로컬 개발에서 HTTPS 사용 시 자체 서명 인증서가 브라우저에서 경고 발생
- `mkcert`로 로컬 CA 설치 권장:
  ```bash
  brew install mkcert
  mkcert -install
  mkcert localhost 127.0.0.1 test.wehago.com
  ```
- vite는 `@vitejs/plugin-basic-ssl`로 간단하게 해결 가능:
  ```bash
  npm i -D @vitejs/plugin-basic-ssl
  ```

### host 설정 보안
- `host: true` 또는 `host: '0.0.0.0'`은 외부 네트워크에서도 접근 가능 → 공개 네트워크에서는 주의
- 팀 내부 개발 환경에서만 사용할 것

### proxy 설정
- API 서버가 별도로 있고 CORS 문제가 있을 때 dev server proxy 사용
- vite의 proxy는 `vite-plugin-checker` 등과 함께 사용 시 충돌 가능 → 순서 확인

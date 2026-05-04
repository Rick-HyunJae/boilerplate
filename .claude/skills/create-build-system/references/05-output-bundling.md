# 05. 빌드 산출물 (Output & Bundling)

## 1. 요구사항

### 해결해야 할 문제
- 개발/운영 환경에 따라 다른 출력 파일명 패턴 적용
- 파일 내용 기반 hash를 통한 브라우저 캐싱 최적화
- JavaScript를 여러 chunk로 분리하여 초기 로딩 속도 개선
- 환경별 소스맵 차등 생성 (개발: 상세, 운영: 없음)
- 이전 빌드 산출물 자동 정리

### 프로젝트 특화 요구사항
- **개발 빌드**: `[name].bundle.js` (hash 없음)
- **운영 빌드**: `js/[name].[contenthash:10].bundle.js` (10자리 hash)
- **청크 파일**: `js/vendor-[name].[contenthash:10].js`
- **CSS**: 개발 `styles/[name].css`, 운영 `styles/[name].[contenthash:10].css`
- **소스맵**: dev serve → `eval-source-map` / prod-dev → `eval-cheap-module-source-map` / prod-live → `false`
- **webpack runtime**: 별도 파일로 추출 (`runtime-{entry}.js`)

---

## 2. 현재 webpack 구현

### 핵심 구조
```js
// webpack.config.js
const isProduction = process.env.NODE_ENV === 'production';
const isLive = process.env.BUILD_TYPE === 'live';

module.exports = {
  // 소스맵: 환경별 차등
  devtool: !isProduction
    ? 'eval-source-map'                      // dev serve
    : isLive
      ? false                                // 운영 빌드
      : 'eval-cheap-module-source-map',      // 개발 빌드

  output: {
    path: isProduction ? path.resolve('build') : undefined,
    publicPath: isProduction ? './' : '/',
    filename: isProduction
      ? 'js/[name].[contenthash:10].bundle.js'
      : '[name].bundle.js',
    clean: true,                             // 이전 빌드 자동 삭제
  },

  optimization: {
    // runtime chunk 분리
    runtimeChunk: { name: (entry) => `runtime-${entry.name}` },

    // chunk 분할
    splitChunks: {
      chunks: 'all',
      minChunks: 2,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,           // 50KB 이상 강제 분할
    },
  },
};

// 청크 파일명 (프로덕션)
// webpack.prod.js
output: {
  chunkFilename: 'js/vendor-[name].[contenthash:10].js',
}
```

---

## 3. 빌드 도구별 구현 방식

### vite

**필요 패키지**: 없음 (vite 내장)

**vite.config.ts**:
```ts
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';
const isLive = process.env.BUILD_TYPE === 'live';

export default defineConfig({
  // 소스맵: 환경별 차등
  build: {
    sourcemap: !isProduction
      ? true                                 // dev serve (vite dev는 항상 sourcemap)
      : isLive
        ? false                              // 운영 빌드
        : 'inline',                          // 개발 빌드

    // 출력 경로
    outDir: 'build',
    emptyOutDir: true,                       // 이전 빌드 자동 삭제

    rollupOptions: {
      output: {
        // 진입점 파일명
        entryFileNames: isProduction
          ? 'js/[name].[hash].bundle.js'
          : '[name].bundle.js',

        // 청크 파일명
        chunkFileNames: isProduction
          ? 'js/vendor-[name].[hash].js'
          : '[name].js',

        // 자산 파일명 (CSS 등)
        assetFileNames: isProduction
          ? 'styles/[name].[hash][extname]'
          : 'styles/[name][extname]',

        // 코드 분할 (수동 청크)
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // react 계열 별도 청크
            if (id.includes('react')) return 'vendor-react';
            // 나머지 node_modules
            return 'vendor';
          }
        },
      }
    }
  }
});
```

---

### rollup

**필요 패키지**: 없음 (rollup 내장)

```js
// rollup.config.mjs
const isLive = process.env.BUILD_TYPE === 'live';

export default {
  output: {
    dir: 'build',
    format: 'es',

    // 진입점 파일명
    entryFileNames: `js/[name].[hash].bundle.js`,

    // 청크 파일명
    chunkFileNames: `js/vendor-[name].[hash].js`,

    // 자산 파일명
    assetFileNames: `styles/[name].[hash][extname]`,

    // 소스맵
    sourcemap: isLive ? false : true,

    // 코드 분할
    manualChunks: {
      'vendor-react': ['react', 'react-dom'],
    },
  }
};
```

---

### esbuild

**필요 패키지**: 없음 (esbuild 내장)

```js
// esbuild.config.mjs
import { build } from 'esbuild';
import fs from 'fs';

const isLive = process.env.BUILD_TYPE === 'live';

await build({
  entryPoints: { app: 'src/index.tsx' },
  outdir: 'build',
  bundle: true,
  format: 'esm',

  // 출력 파일명 패턴
  entryNames: 'js/[name].[hash]',
  chunkNames: 'js/vendor-[name]-[hash]',
  assetNames: 'static/[name]-[hash]',

  // 소스맵
  sourcemap: isLive ? false : true,

  // 코드 분할 (ESM only, 실험적)
  splitting: true,

  // 이전 빌드 정리 (esbuild에는 clean 옵션 없음)
});

// 이전 빌드 수동 정리
if (fs.existsSync('build')) {
  fs.rmSync('build', { recursive: true });
}
```

> esbuild의 `splitting`은 ESM 포맷에서만 동작하며 실험적 기능임.
> CommonJS가 필요한 경우 rollup 조합 권장.

---

## 4. 빈 프로젝트 세팅 시 주의사항

### hash vs contenthash
- **contenthash**: 파일 내용이 변경될 때만 hash 변경 → 캐싱 최적화
- **hash**: 모든 빌드마다 hash 변경 (webpack 구버전 방식)
- vite/rollup은 `[hash]` 사용 (contenthash 동일 동작)

### 소스맵 보안 정책
- 운영 서버에 소스맵이 노출되면 비즈니스 로직이 역추적 가능
- `isLive = true`일 때는 반드시 `sourcemap: false`
- CI/CD에서 빌드 후 소스맵을 Sentry 등 에러 추적 서비스에만 업로드하고 서버에는 올리지 않는 방법도 있음

### publicPath
- SPA를 서브 경로에 배포할 경우 (`example.com/app/`): `base: '/app/'` (vite) 또는 `publicPath: '/app/'` (webpack)
- 로컬 파일로 열 경우 (`file://`): `'./'` 상대 경로 사용

### 청크 크기 최적화
- 너무 많은 청크 = HTTP 요청 증가 (HTTP/1.1 환경)
- 너무 큰 청크 = 초기 로딩 지연
- `maxInitialRequests: 30`, `enforceSizeThreshold: 50000` 기준이 시작점으로 적합

# 07. 성능 최적화 (Performance Optimization)

## 1. 요구사항

### 해결해야 할 문제
- JavaScript/CSS 번들 크기 최소화
- 사용하지 않는 코드 제거 (Tree shaking)
- 자주 변경되지 않는 라이브러리를 사전 번들링하여 빌드 시간 단축
- 빌드 캐시로 반복 빌드 속도 향상
- 코드 분할로 초기 로딩 속도 개선

### 프로젝트 특화 요구사항
- JS minify: TerserPlugin (parallel: 4, 변수명 축약, 미사용 코드 제거, 주석 제거)
- 사전 번들 대상: react, react-router-dom, lodash-es (DllPlugin)
- filesystem cache: 환경별 캐시 분리 (`PRODUCTION_WEHAGO_LIVE_YYYYMMDD` 형태)
- 운영 빌드에서만 캐시 사용, 개발은 memory cache

---

## 2. 현재 webpack 구현

### 사용 패키지
```
terser-webpack-plugin
css-minimizer-webpack-plugin
```

### JS/CSS Minify
```js
// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: 4,                         // 4개 스레드 병렬
        extractComments: false,              // 라이선스 주석 추출 안 함
        terserOptions: {
          sourceMap: false,
          mangle: true,                      // 변수명 축약
          compress: {
            ecma: 5,
            unused: true,                    // 미사용 코드 제거
          },
          format: {
            ecma: 5,
            comments: false,                 // 주석 제거
          }
        }
      }),
      new CssMinimizerPlugin(),
    ],
    removeEmptyChunks: true,
    removeAvailableModules: true,
  }
};
```

### 사전 번들 (DllPlugin)
```js
// create:dll 스크립트로 사전 생성
// library.webpack.config.js
module.exports = {
  entry: { library: ['react', 'react-router-dom', 'lodash-es'] },
  output: {
    path: path.join(__dirname, 'cache/dll/DLL_YYYYMMDD'),
    filename: '[name].dll.js',
    library: '[name]',
  },
  plugins: [
    new webpack.DllPlugin({
      name: '[name]',
      path: path.join(__dirname, 'cache/dll/DLL_YYYYMMDD/manifest.json'),
    })
  ]
};

// 메인 빌드에서 참조
new webpack.DllReferencePlugin({
  manifest: require('./cache/dll/DLL_YYYYMMDD/manifest.json'),
})
```

### 빌드 캐시
```js
// 프로덕션: filesystem cache (환경별 분리)
cache: {
  type: 'filesystem',
  name: `${NODE_ENV}_${SERVICE_TYPE}_${BUILD_TYPE}_${VERSION}`.toUpperCase(),
  version: '20260126',
  cacheLocation: path.resolve('webpack/cache/build', CACHE_NAME),
  compression: 'gzip',
  idleTimeout: 60000,
}

// 개발: memory cache
cache: { type: 'memory' }
```

---

## 3. 빌드 도구별 구현 방식

### vite

**필요 패키지**: 없음 (내장)

```ts
// vite.config.ts
export default defineConfig({
  build: {
    // JS minify (기본: esbuild, 대안: terser)
    minify: 'esbuild',                       // 기본값, 매우 빠름
    // minify: 'terser',                     // 더 작은 번들 (느림)

    // CSS minify (기본: lightningcss)
    cssMinify: true,

    // 사전 번들 (vite는 자동으로 node_modules 사전 번들링)
    // DllPlugin 상당: optimizeDeps
  },

  // 사전 번들 대상 명시 (자동 탐지 외 추가)
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lodash-es'],
    // 제외할 패키지 (이미 ESM인 경우)
    exclude: [],
  },

  // 빌드 캐시: 자동으로 node_modules/.vite에 저장
  // 환경 변경 시 자동 무효화 (package.json, vite.config.ts 변경 감지)
});
```

**terser 사용 시** (더 작은 번들 필요 시):
```bash
npm i -D @rollup/plugin-terser
```
```ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: { unused: true, drop_console: true },
    format: { comments: false },
  }
}
```

---

### rollup

**필요 패키지**:
```bash
npm i -D @rollup/plugin-terser
```

```js
// rollup.config.mjs
import terser from '@rollup/plugin-terser';

export default {
  plugins: [
    terser({
      compress: { unused: true },
      format: { comments: false },
    })
  ],
  // tree shaking: rollup 내장 (별도 설정 불필요)
  // 사전 번들: manualChunks로 vendor 분리
  output: {
    manualChunks: {
      'vendor-react': ['react', 'react-dom', 'react-router-dom'],
      'vendor-lodash': ['lodash-es'],
    }
  }
};
```

**빌드 캐시**: rollup의 캐시 API 활용
```js
import { rollup } from 'rollup';
import fs from 'fs';

// 캐시 파일 로드
const cacheFile = '.rollup-cache.json';
let cache;
if (fs.existsSync(cacheFile)) {
  cache = JSON.parse(fs.readFileSync(cacheFile));
}

const bundle = await rollup({ input: 'src/index.tsx', cache });
// 캐시 저장
fs.writeFileSync(cacheFile, JSON.stringify(bundle.cache));
```

---

### esbuild

**필요 패키지**: 없음 (내장)

```js
// esbuild.config.mjs
import { build, context } from 'esbuild';

await build({
  // JS minify (내장, 매우 빠름)
  minify: true,
  // 세부 제어
  minifyIdentifiers: true,  // 변수명 축약
  minifySyntax: true,       // 문법 최소화
  minifyWhitespace: true,   // 공백 제거

  // tree shaking (내장)
  treeShaking: true,

  // 빌드 캐시: incremental (watch 모드에서 효과적)
  // context API로 incremental rebuild
});

// incremental 빌드 (watch 모드)
const ctx = await context({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  minify: true,
});
await ctx.watch(); // 파일 변경 감지 후 자동 재빌드
```

**사전 번들**: esbuild는 자동 사전 번들 없음 → 수동 entry 분리
```js
await build({
  entryPoints: {
    app: 'src/index.tsx',
    vendor: 'src/vendor-entry.ts',  // react, lodash-es 등을 re-export하는 파일
  },
  splitting: true,
  format: 'esm',
});
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### Tree shaking 조건
- **ESM(import/export)** 형태의 코드여야 tree shaking 동작
- CommonJS(`require/module.exports`)는 tree shaking 불가
- `package.json`에 `"sideEffects": false` 또는 배열로 side effect 파일 명시

### 사전 번들 전략 비교
| 도구 | 방식 | 특징 |
|------|------|------|
| webpack | DllPlugin (수동, `create:dll` 스크립트) | 빌드 전 별도 실행 필요, 검증된 방식 |
| vite | optimizeDeps (자동) | 처음 실행 시 자동 탐지/번들, 재실행 필요 없음 |
| rollup | manualChunks (수동) | 번들 분리 용도, DllPlugin 상당 기능 없음 |
| esbuild | 수동 entry 분리 | optimizeDeps 없음, 직접 구성 필요 |

### 빌드 캐시 무효화 조건
- **webpack**: `name`, `version` 변경 시 캐시 무효화 (환경 변수로 제어)
- **vite**: `package.json`, `vite.config.ts`, `.env` 변경 시 자동 무효화
- **rollup**: 캐시 파일 수동 관리 (CI에서는 캐시 파일 삭제 후 재생성)
- **esbuild**: incremental 캐시는 프로세스 내에서만 유지

### CSS minify
- vite: lightningcss (기본, 매우 빠름)
- webpack: CssMinimizerPlugin (PostCSS 기반)
- rollup: `rollup-plugin-postcss`의 minimize 옵션
- esbuild: CSS minify 내장 (`minify: true`에 포함)

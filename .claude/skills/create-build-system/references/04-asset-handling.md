# 04. 자산 처리 (Asset Handling)

## 1. 요구사항

### 해결해야 할 문제
- 이미지(SVG, PNG, JPG, GIF), 폰트(EOT, TTF, WOFF, WOFF2), JSON 파일을 번들에 포함
- 파일 크기 기준으로 인라인(base64) vs 파일 분리 자동 결정
- 출력 경로를 타입별로 구분 (`static/image/`, `static/font/`)

### 프로젝트 특화 요구사항
- **이미지**: 10KB 이하 → base64 인라인 / 초과 → `static/image/[name].[ext]`
- **폰트**: 10KB 이하 → base64 인라인 / 초과 → `static/font/[name]-[hash].[ext]`
- JSON: 기본 JS 모듈로 처리 (webpack 5 내장 `type: 'json'`)

---

## 2. 현재 webpack 구현

### 사용 패키지
```
file-loader
url-loader
```

### 핵심 구조
```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      // 폰트: 10KB 기준 인라인/파일 분기
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,                        // 10KB
            name: 'static/font/[name]-[hash].[ext]',
          }
        }]
      },
      // 이미지: 10KB 기준 인라인/파일 분기
      {
        test: /\.(svg|gif|png|jpe?g)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,                        // 10KB
            name: 'static/image/[name].[ext]',
          }
        }]
      },
      // JSON: webpack 5 내장 처리
      {
        test: /\.json$/,
        type: 'json',
      }
    ]
  }
};
```

---

## 3. 빌드 도구별 구현 방식

### vite

webpack의 file-loader / url-loader와 동일한 기능을 native로 제공.

**필요 패키지**: 없음 (vite 내장)

**vite.config.ts**:
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 10000, // 10KB 이하 base64 인라인 (기본값: 4096)
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          // 폰트
          if (/\.(eot|ttf|woff|woff2)$/.test(name)) {
            return 'static/font/[name]-[hash][extname]';
          }
          // 이미지
          if (/\.(svg|gif|png|jpe?g)$/.test(name)) {
            return 'static/image/[name][extname]';
          }
          return 'static/[name]-[hash][extname]';
        }
      }
    }
  }
});
```

**코드에서 자산 사용**:
```ts
// 이미지 import (자동으로 경로 또는 base64 반환)
import logo from './logo.svg';
import photo from './photo.png';

// ?url: 항상 파일 경로로 가져오기 (인라인 강제 해제)
import iconUrl from './icon.svg?url';

// ?inline: 항상 base64 인라인
import smallIcon from './small.svg?inline';

// ?raw: 파일 내용을 문자열로
import svgContent from './icon.svg?raw';
```

---

### rollup

**필요 패키지**:
```bash
npm i -D @rollup/plugin-url @rollup/plugin-image
```

```js
// rollup.config.mjs
import url from '@rollup/plugin-url';
import image from '@rollup/plugin-image';

export default {
  plugins: [
    // 폰트 처리
    url({
      include: ['**/*.eot', '**/*.ttf', '**/*.woff', '**/*.woff2'],
      limit: 10000,                             // 10KB
      fileName: 'static/font/[name]-[hash][extname]',
    }),
    // 이미지 처리
    url({
      include: ['**/*.svg', '**/*.gif', '**/*.png', '**/*.jpg', '**/*.jpeg'],
      limit: 10000,                             // 10KB
      fileName: 'static/image/[name][extname]',
    }),
    // 이미지를 JS에서 import할 때 base64로 처리
    image(),
  ]
};
```

---

### esbuild

esbuild는 `loader` 옵션으로 자산 처리.

**필요 패키지**: 없음 (esbuild 내장)

```js
// esbuild.config.mjs
import { build } from 'esbuild';

await build({
  loader: {
    // 폰트
    '.eot':   'file',
    '.ttf':   'file',
    '.woff':  'file',
    '.woff2': 'file',
    // 이미지
    '.svg':   'dataurl',  // base64 인라인 (또는 'file'로 파일 출력)
    '.png':   'dataurl',
    '.jpg':   'dataurl',
    '.jpeg':  'dataurl',
    '.gif':   'dataurl',
    // JSON은 자동 처리 (별도 설정 불필요)
  },
  assetNames: 'static/[name]-[hash]', // 파일 출력 시 경로 패턴
});
```

**크기 기준 인라인/파일 분기**:
- esbuild는 단일 loader 값으로만 설정 (dataurl or file), 크기 기준 자동 분기 불가
- 해결방법: plugin으로 커스텀 처리
```js
const imageSizePlugin = {
  name: 'image-size-handler',
  setup(build) {
    build.onLoad({ filter: /\.(png|jpg|jpeg|gif|svg)$/ }, async (args) => {
      const fs = await import('fs');
      const stat = fs.statSync(args.path);
      if (stat.size <= 10000) {
        // 10KB 이하: base64
        const data = fs.readFileSync(args.path);
        const ext = args.path.split('.').pop();
        return {
          contents: `export default "data:image/${ext};base64,${data.toString('base64')}"`,
          loader: 'js',
        };
      }
      // 10KB 초과: 파일 복사 (별도 처리 필요)
      return { loader: 'file' };
    });
  }
};
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### 자산 import 방식 변화 (vite)
- vite에서 SVG를 React 컴포넌트로 import하려면 `vite-plugin-svgr` 추가 필요:
```bash
npm i -D vite-plugin-svgr
```
```ts
// vite.config.ts
import svgr from 'vite-plugin-svgr';
plugins: [react(), svgr()]
```
```tsx
import { ReactComponent as Logo } from './logo.svg';
// 또는
import Logo from './logo.svg?react';
```

### 폰트 파일 경로
- 개발 서버(dev server)와 프로덕션 빌드에서 폰트 경로가 달라지는 경우 주의
- CSS에서 `@font-face` 사용 시 상대 경로가 올바른지 확인

### 크기 임계값
- 10KB가 프로젝트 기준값 (서버 요청 수 vs 번들 크기 트레이드오프)
- 폰트는 보통 크기가 커서 대부분 파일로 추출됨
- 작은 아이콘 SVG는 인라인으로 처리하면 HTTP 요청 절약

### JSON 처리
- webpack 5, vite, rollup, esbuild 모두 JSON을 JS 모듈로 자동 처리
- 별도 설정 불필요

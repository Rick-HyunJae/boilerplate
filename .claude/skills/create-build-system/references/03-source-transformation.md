# 03. 소스 변환 (Source Transformation)

## 1. 요구사항

### 해결해야 할 문제
- TypeScript, JSX, TSX 파일을 브라우저가 실행할 수 있는 JS로 변환
- CSS Modules (`.module.css`, `.module.scss`) 지원
- SCSS 파일 처리
- HTML 진입점 경로 지정 (기본: 프로젝트 루트, 사용자 지정 가능)
- React Fast Refresh (HMR 시 컴포넌트 상태 보존)

### 프로젝트 특화 요구사항
- babel + TypeScript: `@babel/preset-typescript`, `@babel/preset-react`, `@babel/preset-env`
- 브라우저 타겟: Chrome/Firefox/Safari/iOS/Android 최신 2~1버전
- CSS Module 클래스명 형식: `[local]__[hash:base64:5]` (getCSSModuleLocalIdent)
- HTML 템플릿: SERVICE_TYPE에 따라 다른 HTML 파일 (`wehago.html`, `wehagom.html`)

---

## 2. 현재 webpack 구현

### 사용 패키지
```
babel-loader, @babel/core, @babel/preset-env, @babel/preset-react, @babel/preset-typescript
ts-loader
css-loader, mini-css-extract-plugin, style-loader
sass-loader, sass
html-webpack-plugin
react-refresh, @pmmmwh/react-refresh-webpack-plugin
```

### JS/TS/JSX 변환
```js
// webpack.config.js
{
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'ts-loader'],
      }
    ]
  }
}
```

**.babelrc**:
```json
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false,
      "targets": {
        "chrome": ">=2", "firefox": ">=2", "safari": ">=2",
        "ios": ">=1", "android": ">=4"
      }
    }],
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",
    "@babel/plugin-transform-optional-chaining",
    "@babel/plugin-transform-nullish-coalescing-operator"
  ]
}
```

### CSS / CSS Modules / SCSS
```js
// 개발: style-loader (HMR 지원), 프로덕션: MiniCssExtractPlugin.loader
const cssLoaders = (isProduction) => [
  isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
  {
    loader: 'css-loader',
    options: { sourceMap: !isProduction }
  }
];

// CSS Module 처리
{
  test: /\.module\.css$/,
  use: [
    ...cssLoaders(isProduction),
    { loader: 'css-loader', options: { modules: { getLocalIdent: getCSSModuleLocalIdent } } }
  ]
}

// SCSS
{
  test: /\.(scss|sass)$/,
  use: [...cssLoaders(isProduction), 'sass-loader']
}
```

### HTML 진입점 (경로 지정 가능)
```js
// HTML_ENTRY 변수로 경로 지정
const HTML_ENTRY = process.env.HTML_ENTRY || './index.html';
// SERVICE_TYPE별 다른 HTML: './public/wehago.html'

new HtmlWebpackPlugin({
  template: HTML_ENTRY,
  filename: 'index.html',
  minify: isProduction ? { collapseWhitespace: true, removeComments: true } : false,
})
```

---

## 3. 빌드 도구별 구현 방식

### vite

**필요 패키지**:
```bash
npm i -D vite @vitejs/plugin-react sass
# CSS Modules은 vite 내장, 별도 패키지 불필요
```

**vite.config.ts**:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// HTML 진입점 경로 (사용자 지정 가능)
const HTML_ENTRY = process.env.HTML_ENTRY || './index.html';

export default defineConfig({
  plugins: [
    react(), // JSX + React Fast Refresh 자동 포함
  ],
  css: {
    modules: {
      // CSS Module 클래스명 형식
      generateScopedName: '[local]__[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        // SCSS 전역 변수/믹스인 자동 주입 (선택)
        // additionalData: `@import "src/styles/variables";`
      }
    }
  },
  // HTML 진입점 변경 (기본은 프로젝트 루트의 index.html)
  root: './',  // index.html이 루트에 없다면 이 경로를 변경
  build: {
    rollupOptions: {
      input: HTML_ENTRY, // 직접 경로 지정
    }
  }
});
```

**HTML 진입점 경로 변경**:
- 기본: 프로젝트 루트 `./index.html`
- `src/index.html`로 변경: `root: './src'` 또는 `build.rollupOptions.input: './src/index.html'`

**CSS Modules**: `.module.css`, `.module.scss` 파일명이면 자동 적용 (추가 설정 불필요)

---

### rollup

**필요 패키지**:
```bash
npm i -D rollup @rollup/plugin-typescript @rollup/plugin-babel @babel/core @babel/preset-react @babel/preset-typescript rollup-plugin-postcss sass @rollup/plugin-html
```

```js
// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import html from '@rollup/plugin-html';

// HTML 진입점 경로 (사용자 지정 가능)
const HTML_ENTRY = process.env.HTML_ENTRY || './index.html';

export default {
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react', '@babel/preset-typescript'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    postcss({
      modules: true,                    // CSS Modules 활성화
      extract: true,                    // CSS 별도 파일 추출
      use: ['sass'],                    // SCSS 지원
    }),
    html({
      template: ({ files }) => {
        const template = fs.readFileSync(HTML_ENTRY, 'utf-8');
        // 번들 파일 자동 주입
        return template.replace('</body>', `<script src="${files.js[0].fileName}"></script></body>`);
      }
    }),
  ]
};
```

---

### esbuild

**필요 패키지**:
```bash
npm i -D esbuild esbuild-sass-plugin esbuild-css-modules-plugin
```

```js
// esbuild.config.mjs
import { build } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import fs from 'fs';

// HTML 진입점 경로 (사용자 지정 가능)
const HTML_ENTRY = process.env.HTML_ENTRY || './index.html';

await build({
  entryPoints: ['src/index.tsx'],      // JS 진입점
  bundle: true,
  plugins: [
    sassPlugin(),                       // SCSS 지원
    cssModulesPlugin({
      // CSS Modules: .module.css, .module.scss 처리
      generateScopedName: '[local]__[hash:base64:5]',
    }),
  ],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
  },
  jsx: 'automatic',                    // React 17+ automatic runtime
});

// HTML에 번들 파일 삽입 (후처리)
const html = fs.readFileSync(HTML_ENTRY, 'utf-8');
const result = html.replace('</body>', '<script src="./bundle.js"></script></body>');
fs.writeFileSync('dist/index.html', result);
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### index.html 경로 지정 방법 요약
| 도구 | 기본 경로 | 사용자 지정 방법 |
|------|---------|---------------|
| webpack | `./index.html` | `HtmlWebpackPlugin({ template: HTML_ENTRY })` |
| vite | 프로젝트 루트 | `root` 옵션 변경 또는 `build.rollupOptions.input` |
| rollup | 없음 (직접 설정) | `@rollup/plugin-html`의 template 옵션 |
| esbuild | 없음 (직접 설정) | 후처리 스크립트로 HTML 복사 + 번들 삽입 |

### React Fast Refresh
- **vite**: `@vitejs/plugin-react` 포함 시 자동 활성화
- **webpack**: `@pmmmwh/react-refresh-webpack-plugin` + `react-refresh` 별도 설치 필요
- **rollup/esbuild**: dev server와 함께 사용 시에만 의미 있음 → vite 조합 권장

### TypeScript strict 모드
- `tsconfig.json`에 `"strict": true` 권장
- `"jsx": "react-jsx"` 설정 필수 (React 17+ automatic runtime)
- `"moduleResolution": "bundler"` (vite 권장) 또는 `"node16"`

### CSS Modules 클래스명 충돌 방지
- 파일명에 `.module.` 포함 여부로 자동 구분 (webpack/vite/rollup 공통)
- esbuild는 plugin 설정이 필요하며 `.module.` 패턴 처리 방식 확인 필요

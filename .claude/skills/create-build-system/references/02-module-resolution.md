# 02. 모듈 해석 (Module Resolution)

## 1. 요구사항

### 해결해야 할 문제
- 깊은 상대 경로(`../../components/Button`) 대신 짧은 별칭(`~components/Button`)으로 import
- TypeScript IDE 자동완성과 타입 검사가 동일한 별칭 경로에서 동작
- 빌드 도구와 tsconfig.json의 alias 설정이 항상 동기화 상태 유지

### 프로젝트 특화 요구사항
- `~` 접두사 기반 17개 alias:
  ```
  ~public     → /public
  ~common     → /common
  ~src        → /src
  ~pages      → /src/pages
  ~store      → /src/store
  ~config     → /src/config
  ~context    → /src/context
  ~components → /src/components
  ~layouts    → /src/layouts
  ~utils      → /src/utils
  ~hooks      → /src/hooks
  ~api        → /src/api
  ~constants  → /src/constants
  ~dialogs    → /src/dialogs
  ~css        → /src/static/css
  ~images     → /src/static/images
  ~language   → /src/static/language
  ```
- TypeScript에서도 동일하게 인식 (IDE 자동완성 + `tsc` 빌드)

---

## 2. 현재 webpack 구현

### 사용 패키지
```
webpack (resolve.alias 내장)
```

### 핵심 구조

**webpack.config.js**:
```js
const path = require('path');
const root = path.resolve(__dirname);

module.exports = {
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '~public':     path.join(root, 'public'),
      '~common':     path.join(root, 'common'),
      '~src':        path.join(root, 'src'),
      '~pages':      path.join(root, 'src/pages'),
      '~store':      path.join(root, 'src/store'),
      '~config':     path.join(root, 'src/config'),
      '~context':    path.join(root, 'src/context'),
      '~components': path.join(root, 'src/components'),
      '~layouts':    path.join(root, 'src/layouts'),
      '~utils':      path.join(root, 'src/utils'),
      '~hooks':      path.join(root, 'src/hooks'),
      '~api':        path.join(root, 'src/api'),
      '~constants':  path.join(root, 'src/constants'),
      '~dialogs':    path.join(root, 'src/dialogs'),
      '~css':        path.join(root, 'src/static/css'),
      '~images':     path.join(root, 'src/static/images'),
      '~language':   path.join(root, 'src/static/language'),
    }
  }
};
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~public/*":     ["public/*"],
      "~common/*":     ["common/*"],
      "~src/*":        ["src/*"],
      "~pages/*":      ["src/pages/*"],
      "~store/*":      ["src/store/*"],
      "~config/*":     ["src/config/*"],
      "~context/*":    ["src/context/*"],
      "~components/*": ["src/components/*"],
      "~layouts/*":    ["src/layouts/*"],
      "~utils/*":      ["src/utils/*"],
      "~hooks/*":      ["src/hooks/*"],
      "~api/*":        ["src/api/*"],
      "~constants/*":  ["src/constants/*"],
      "~dialogs/*":    ["src/dialogs/*"],
      "~css/*":        ["src/static/css/*"],
      "~images/*":     ["src/static/images/*"],
      "~language/*":   ["src/static/language/*"]
    }
  }
}
```

---

## 3. 빌드 도구별 구현 방식

### vite

**옵션 A: resolve.alias 수동 설정 (tsconfig와 별도 관리)**

```bash
npm i -D vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

const root = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      '~public':     path.join(root, 'public'),
      '~common':     path.join(root, 'common'),
      '~src':        path.join(root, 'src'),
      '~components': path.join(root, 'src/components'),
      // ... 나머지 alias
    }
  }
});
```

**옵션 B: vite-tsconfig-paths (tsconfig.json에서 자동 읽기) — 권장**

```bash
npm i -D vite-tsconfig-paths
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  // resolve.alias 별도 설정 불필요 — tsconfig.json의 paths를 그대로 사용
});
```

> tsconfig.json의 paths만 관리하면 webpack alias와 vite alias가 자동 동기화됨

---

### rollup

**필요 패키지**:
```bash
npm i -D @rollup/plugin-alias
```

```js
// rollup.config.mjs
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

export default {
  plugins: [
    alias({
      entries: [
        { find: '~public',     replacement: path.join(root, 'public') },
        { find: '~common',     replacement: path.join(root, 'common') },
        { find: '~src',        replacement: path.join(root, 'src') },
        { find: '~components', replacement: path.join(root, 'src/components') },
        // ... 나머지 alias
      ]
    })
  ]
};
```

> TypeScript 사용 시 tsconfig.json의 paths는 별도로 동기화 필요
> (rollup은 tsconfig paths를 자동으로 읽지 않음)

---

### esbuild

esbuild는 tsconfig.json의 paths를 **자동으로 인식**함.

```bash
npm i -D esbuild
```

```js
// esbuild.config.mjs
import { build } from 'esbuild';

await build({
  tsconfig: './tsconfig.json', // paths 자동 적용
  // 추가 alias가 필요한 경우:
  alias: {
    '~public': './public',
    '~common': './common',
  }
});
```

> tsconfig.json의 paths를 정확히 설정하면 esbuild에서 별도 alias 설정 불필요

---

## 4. 빈 프로젝트 세팅 시 주의사항

### tsconfig.json 설정 필수
- 빌드 도구에서 alias를 설정해도 tsconfig.json의 paths가 없으면 TypeScript 컴파일러가 오류 발생
- 항상 tsconfig.json과 빌드 도구 alias를 동기화할 것

### 동기화 전략
- **webpack / rollup**: 수동 동기화 또는 tsconfig-paths 패키지로 자동화
- **vite**: `vite-tsconfig-paths` 플러그인 사용 시 tsconfig.json만 관리
- **esbuild**: tsconfig.json 자동 인식, 별도 설정 최소화

### alias 네이밍 주의
- `~` 접두사는 Node.js의 기본 경로 해석과 충돌 없음
- `@` 접두사도 자주 쓰임 (예: `@components/Button`) — 팀 관례에 따라 결정
- 한 번 정하면 변경 비용이 큼 (전체 코드베이스 영향)

### 자동완성 및 Go-to-Definition
- tsconfig.json paths 설정이 있어야 VS Code에서 `Ctrl+클릭`으로 파일 탐색 가능
- `baseUrl: "."` 설정 필수

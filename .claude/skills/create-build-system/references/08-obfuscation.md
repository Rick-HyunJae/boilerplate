# 08. 보안: 난독화 (Obfuscation)

## 1. 요구사항

### 해결해야 할 문제
- JavaScript 소스 코드를 역분석하기 어렵게 변환하여 비즈니스 로직 보호
- 특정 폴더/파일에만 선택적으로 적용 (전체 적용 시 성능 저하)
- 난독화 강도를 상황에 맞게 조절 (high/medium/low 프리셋)

### 프로젝트 특화 요구사항
- **적용 대상**: `/common/api` 디렉토리만 (API 통신 로직 보호)
- **적용 안 함**: 개발 환경 (빌드 속도 및 디버깅 편의성)
- **적용 강도**: `high` (운영 빌드)
- **기반 라이브러리**: `javascript-obfuscator`

---

## 2. 현재 webpack 구현

### 사용 패키지
```
webpack-obfuscator
javascript-obfuscator
```

### 핵심 구조

**3가지 난독화 프리셋 정의**:
```js
// obfuscator-presets.js (내재화된 옵션)

const presets = {
  // 극대화 난독화: 런타임 성능 영향 있음
  high: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    identifierNamesGenerator: 'hexadecimal',  // _0xabc123 형태
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],             // RC4 암호화
    stringArrayCallsTransform: true,
    stringArrayWrappersCount: 5,
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    numbersToExpressions: true,
  },

  // 균형잡힌 난독화: 실무 권장
  medium: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    numbersToExpressions: false,
  },

  // 최소 난독화: 성능 우선
  low: {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    identifierNamesGenerator: 'mangled',     // a, b, c 형태 (짧음)
    selfDefending: false,
    stringArray: false,
    renameGlobals: false,
  },
};
```

**webpack에서 적용**:
```js
// webpack.prod.js
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  module: {
    rules: [
      // 난독화 대상 (api 디렉토리만)
      {
        test: /\.(js|ts|tsx)$/,
        include: [path.resolve(__dirname, 'common/api')],
        enforce: 'post',
        use: {
          loader: WebpackObfuscator.loader,
          options: presets.high,  // 강도 선택
        }
      }
    ]
  }
};
```

---

## 3. 빌드 도구별 구현 방식

### vite

**필요 패키지**:
```bash
npm i -D vite-plugin-javascript-obfuscator javascript-obfuscator
```

**vite.config.ts**:
```ts
import { defineConfig } from 'vite';
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator';

// 프리셋 정의 (위 presets 객체 동일하게 사용)
const presets = { high: { ... }, medium: { ... }, low: { ... } };

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    isProduction && javascriptObfuscator({
      // 적용 대상 필터 (폴더/파일 단위)
      include: ['**/common/api/**'],         // 대상 포함
      exclude: ['node_modules/**'],          // 제외
      options: presets.high,                 // 강도 선택
    }),
  ].filter(Boolean),
});
```

**파일별 개별 적용** (더 세밀한 제어):
```ts
javascriptObfuscator({
  include: [
    '**/common/api/**',
    '**/src/secret/**',
  ],
  exclude: [
    '**/common/api/types.ts',   // 특정 파일 제외
  ],
  options: presets.high,
})
```

---

### rollup

**필요 패키지**:
```bash
npm i -D rollup-plugin-obfuscator javascript-obfuscator
```

```js
// rollup.config.mjs
import obfuscator from 'rollup-plugin-obfuscator';

const presets = { high: { ... }, medium: { ... }, low: { ... } };

export default {
  plugins: [
    obfuscator({
      // 파일 필터 (glob 패턴)
      include: ['**/common/api/**'],
      exclude: ['node_modules/**'],
      options: presets.high,
    })
  ]
};
```

---

### esbuild

esbuild는 난독화 native plugin이 없음.  
**빌드 후 CLI 후처리 방식** 사용 (검증됨):

**필요 패키지**:
```bash
npm i -D esbuild javascript-obfuscator glob
```

```js
// esbuild.config.mjs
import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { globSync } from 'glob';
import fs from 'fs';
import path from 'path';

const presets = { high: { ... }, medium: { ... }, low: { ... } };

// 1단계: 기본 빌드
await build({
  entryPoints: ['src/index.tsx'],
  outdir: 'build',
  bundle: true,
});

// 2단계: 대상 파일에만 난독화 후처리
// (빌드 후 api 관련 청크 파일을 찾아서 적용)
const apiChunks = globSync('build/js/vendor-api-*.js');
for (const file of apiChunks) {
  const code = fs.readFileSync(file, 'utf-8');
  const result = JavaScriptObfuscator.obfuscate(code, presets.high);
  fs.writeFileSync(file, result.getObfuscatedCode());
}
```

> esbuild는 청크 분할 후 api 코드가 어느 파일에 들어갔는지 알기 어려움.
> 가능하면 api 코드를 별도 entry로 분리하여 출력 파일을 예측 가능하게 구성:
```js
await build({
  entryPoints: {
    app: 'src/index.tsx',
    'api-layer': 'src/common/api/index.ts',  // api를 별도 entry로
  },
  splitting: true,
  format: 'esm',
});
// 이후 'build/api-layer.js'에만 난독화 적용
```

---

## 4. 빈 프로젝트 세팅 시 주의사항

### 난독화 적용 범위 결정
- **전체 적용**: 빌드 시간 대폭 증가, 런타임 성능 영향, 디버깅 어려움
- **부분 적용** (권장): API/비즈니스 로직 파일만 → 빌드 시간과 보안의 균형
- 적용 경계: 외부에 노출되면 안 되는 로직 (API 키 조합, 인증 로직, 핵심 알고리즘)

### 강도별 선택 기준
| 강도 | 빌드 시간 | 런타임 성능 | 역추적 난이도 | 추천 상황 |
|------|---------|-----------|------------|---------|
| low | +10% | -1% | 낮음 | 경쟁사 코드 복사 방지 정도 |
| medium | +30% | -5% | 중간 | 일반 비즈니스 로직 보호 |
| high | +200% | -15~30% | 높음 | API 통신, 인증, 핵심 알고리즘 |

### selfDefending 옵션 주의
- `selfDefending: true`: 코드가 포맷팅(prettier 등)되면 동작 불가하도록 자체 방어
- 개발 중 포맷터가 실수로 난독화 출력 파일을 건드리면 앱이 중단될 수 있음
- CI/CD에서 포맷터 실행 순서 확인 필요

### 개발 환경에서 비활성화
- 모든 도구에서 `isProduction` 조건으로 난독화 비활성화 필수
- 난독화된 코드는 디버깅이 극히 어려움
- 소스맵이 있어도 난독화 변수명 때문에 가독성 없음

### 난독화 후 테스트
- 난독화 후 빌드된 파일을 반드시 실제 브라우저에서 동작 확인
- `high` 레벨의 `controlFlowFlattening` + `deadCodeInjection`은 드물게 런타임 오류 유발 가능
- CI/CD에 smoke test (기본 페이지 로딩, API 호출) 포함 권장

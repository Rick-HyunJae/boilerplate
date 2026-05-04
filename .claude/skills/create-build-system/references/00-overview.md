# 빌드 시스템 개요 및 도구 선택 가이드

## 8개 필수 기능 요약

새 빌드 시스템에는 아래 8개 기능이 반드시 포함되어야 한다.
각 기능의 상세 구현은 개별 references 파일을 참조.

| # | 기능 | 핵심 요구사항 |
|---|------|-------------|
| 1 | **환경 관리** | 다중 환경 분기 (BUILD_TYPE/SERVICE_TYPE), 환경변수를 JS와 HTML 양쪽에 주입 |
| 2 | **모듈 해석** | `~src`, `~components` 등 단축 경로, tsconfig paths 동기화 |
| 3 | **소스 변환** | TS/JSX 트랜스파일, CSS Modules, SCSS, HTML 진입점 경로 지정 |
| 4 | **자산 처리** | 이미지/폰트/JSON 파일, 크기 기준 인라인/파일 분기 |
| 5 | **빌드 산출물** | 환경별 파일명 패턴(contenthash), 소스맵 차등, chunk 분리 |
| 6 | **개발 서버** | HMR, HTTPS, 동적 host/port, 정적 파일 서빙 |
| 7 | **성능 최적화** | JS/CSS minify, tree shaking, 사전번들, 빌드 캐시 |
| 8 | **난독화** | 폴더·파일 단위 선택 적용, high/medium/low 옵션 프리셋 |

---

## 빌드 도구 비교 매트릭스

✅ Native 지원 / 🟡 Plugin 필요 / 🟠 별도 구성 필요 / 🔴 미지원 (후처리/대체)

| 기능 | webpack | vite | rollup | esbuild |
|------|---------|------|--------|---------|
| 환경변수 (JS) | DefinePlugin | ✅ `define`+`loadEnv` | 🟡 `@rollup/plugin-replace` | ✅ `define` |
| 환경변수 (HTML %VAR%) | InterpolateHtmlPlugin | ✅ native | 🟠 plugin+후처리 | 🔴 후처리 |
| Path alias | `resolve.alias` | ✅ `resolve.alias` | 🟡 `@rollup/plugin-alias` | ✅ `alias` 옵션 |
| tsconfig paths 연동 | 수동 동기화 | 🟡 `vite-tsconfig-paths` | 🟡 `@rollup/plugin-typescript` | ✅ 자동 인식 |
| TS/JSX 변환 | babel+ts-loader | ✅ esbuild 내장 | 🟡 `@rollup/plugin-typescript` | ✅ 내장 |
| CSS Modules | css-loader | ✅ 내장 | 🟡 `rollup-plugin-postcss` | 🟠 `esbuild-css-modules-plugin` |
| SCSS | sass-loader | 🟡 `sass` 설치만 | 🟡 postcss+sass | 🟡 `esbuild-sass-plugin` |
| HTML 진입점 | HtmlWebpackPlugin | ✅ `root` 옵션 | 🟠 `@rollup/plugin-html` | 🟠 `esbuild-plugin-html` |
| 이미지/폰트 | file/url-loader | ✅ native | 🟡 `@rollup/plugin-url` | ✅ `loader` 옵션 |
| HMR | HMRPlugin | ✅ 내장 | 🔴 약함 | 🟠 수동 구현 |
| HTTPS / proxy | devServer 옵션 | ✅ `server.https/proxy` | 🔴 별도 구성 | 🔴 별도 구성 |
| JS minify | TerserPlugin | ✅ esbuild (또는 terser) | 🟡 `@rollup/plugin-terser` | ✅ 내장 |
| CSS minify | CssMinimizerPlugin | ✅ lightningcss | 🟡 postcss | 🟠 plugin |
| Tree shaking | sideEffects+terser | ✅ rollup 기반 | ✅ 내장 | ✅ 내장 |
| Code splitting | splitChunks | ✅ `manualChunks` | ✅ `output.manualChunks` | 🟡 `splitting:true` (ESM only) |
| 사전 번들 (vendor) | DllPlugin | ✅ `optimizeDeps` 자동 | 🟠 수동 manualChunks | 🟠 수동 |
| 빌드 캐시 | filesystem cache | ✅ `.vite` 캐시 | 🟡 `cache` 옵션 | ✅ `incremental` API |
| 난독화 | webpack-obfuscator | 🟡 vite-plugin-obfuscator | 🟡 rollup-plugin-obfuscator | 🔴 CLI 후처리 필요 |

---

## 검증된 조합 패턴

rollup과 esbuild는 dev server가 약하므로 vite와 조합 권장.

### 패턴 A: vite 단독 (가장 권장)
```
dev:   vite
build: vite build (내부적으로 rollup)
```
- 8개 기능 모두 단독으로 충족
- HMR, HTTPS, proxy 내장
- `optimizeDeps`로 사전 번들 자동 처리
- `vite-plugin-javascript-obfuscator`로 난독화 가능

### 패턴 B: vite(dev) + rollup(build)
```
dev:   vite dev
build: rollup --config rollup.config.mjs
```
- vite의 build engine이 이미 rollup → 설정 호환성 높음
- rollup의 세밀한 output 제어가 필요할 때 선택
- 단, CSS/자산 처리를 rollup 쪽에도 별도 설정 필요

```json
// package.json
"scripts": {
  "dev": "vite",
  "build": "rollup --config rollup.config.mjs"
}
```

### 패턴 C: vite(dev) + esbuild(build)
```
dev:   vite dev
build: node esbuild.config.mjs
```
- 압도적 빌드 속도가 필요할 때 선택
- vite가 내부적으로 esbuild 사용하므로 설정 개념 공유
- esbuild는 난독화 native 미지원 → 후처리 단계 별도 추가 필요

```json
// package.json
"scripts": {
  "dev": "vite",
  "build": "node esbuild.config.mjs"
}
```

### 패턴 D: webpack 단독
```
dev:   webpack serve
build: webpack --config webpack.config.js
```
- 현재 프로젝트와 동일한 구성
- 8개 기능 모두 검증됨
- templates/webpack.config.template.js 참조

---

## 도구 선택 가이드

| 상황 | 권장 |
|------|------|
| 새 프로젝트, 빠른 시작 | vite 단독 (패턴 A) |
| 라이브러리 패키지 배포 | rollup (패턴 B) |
| CI/CD 빌드 시간 단축 최우선 | esbuild (패턴 C) |
| 기존 webpack 마이그레이션 최소화 | webpack (패턴 D) |
| 팀 내 webpack 경험 있음 | webpack (패턴 D) |

---

## 빈 프로젝트 세팅 체크리스트

```
[ ] Node.js ≥ 20.x 확인
[ ] package.json 생성: npm init -y
[ ] TypeScript 사용 여부 결정
[ ] index.html 위치 결정 (기본: 프로젝트 루트)
[ ] 빌드 도구/조합 선택
[ ] 패키지 설치 (선택한 도구의 references 참조)
[ ] Config 파일 생성 (templates/ 복사 + 수정)
[ ] package.json 스크립트 추가
[ ] tsconfig.json paths 설정 (alias 사용 시)
[ ] .env 파일 생성
[ ] 09-feature-parity-checklist.md로 8개 기능 검증
```

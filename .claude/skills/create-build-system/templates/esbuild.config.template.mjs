/**
 * esbuild.config.template.mjs
 *
 * Self-contained esbuild 설정 템플릿 (Build 전용).
 * 외부 프로젝트에서 그대로 복사하여 사용 가능.
 *
 * [중요] 이 설정은 Build 전용입니다.
 * Dev server는 vite를 함께 사용하세요 (검증된 조합).
 * references/06-dev-server.md 참조.
 *
 * [중요] 난독화
 * esbuild는 난독화 native 미지원.
 * 빌드 후 javascript-obfuscator CLI로 후처리합니다.
 * 난독화 대상 파일을 별도 entry로 분리하여 출력 파일을 예측 가능하게 구성.
 * references/08-obfuscation.md 참조.
 *
 * [수정 필요 항목]
 * - OBFUSCATE_ENTRY: 난독화 적용할 별도 entry 파일
 * - alias: 프로젝트 디렉토리 구조에 맞게 조정
 * - HTML_ENTRY: index.html 경로
 *
 * [설치 패키지]
 * # Build (esbuild)
 * npm i -D esbuild
 *           esbuild-sass-plugin esbuild-css-modules-plugin
 *           javascript-obfuscator glob
 *           dotenv cross-env
 *
 * # Dev (vite) - 조합 패턴
 * npm i -D vite @vitejs/plugin-react vite-tsconfig-paths
 *
 * [npm scripts]
 * "dev":          "cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago vite"
 * "dev:prod":     "cross-env HTTPS=true BUILD_TYPE=live SERVICE_TYPE=wehago vite"
 * "build:dev":    "cross-env NODE_ENV=production BUILD_TYPE=dev SERVICE_TYPE=wehago node esbuild.config.mjs"
 * "build:prod":   "cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehago node esbuild.config.mjs"
 * "build:wehagom":"cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehagom node esbuild.config.mjs"
 */

import { build } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { globSync } from 'glob';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 환경 변수 ────────────────────────────────────────────────────────────────
const rawEnv = { ...dotenv.config().parsed, ...process.env };

const NODE_ENV     = rawEnv.NODE_ENV     || 'production';
const BUILD_TYPE   = rawEnv.BUILD_TYPE   || 'dev';
const SERVICE_TYPE = rawEnv.SERVICE_TYPE || 'wehago';

const isLive = BUILD_TYPE === 'live';

// ─── 경로 ─────────────────────────────────────────────────────────────────────
const ROOT   = __dirname;
const SRC    = path.join(ROOT, 'src');
const COMMON = path.join(ROOT, 'common');
const PUBLIC = path.join(ROOT, 'public');
const OUT    = path.join(ROOT, 'build');

// HTML 진입점 (사용자 지정 가능)
const HTML_ENTRY = process.env.HTML_ENTRY || path.join(ROOT, 'index.html');

// ─── 외부 리소스 ──────────────────────────────────────────────────────────────
function getStaticLink(buildType, serviceType) {
  if (buildType === 'live') {
    return serviceType === 'wehagom'
      ? 'https://static.wehagov.com'
      : 'https://static.wehago.com';
  }
  return 'http://172.16.114.131';
}

const STATIC_LINK = getStaticLink(BUILD_TYPE, SERVICE_TYPE);

// ─── 난독화 프리셋 ─────────────────────────────────────────────────────────────
const obfuscatorPresets = {
  high: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayCallsTransform: true,
    stringArrayWrappersCount: 5,
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    numbersToExpressions: true,
  },
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
  },
  low: {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    identifierNamesGenerator: 'mangled',
    selfDefending: false,
    stringArray: false,
  },
};

// ─── 이전 빌드 정리 ───────────────────────────────────────────────────────────
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true });
}
fs.mkdirSync(OUT, { recursive: true });

// ─── 공통 esbuild 옵션 ────────────────────────────────────────────────────────
const commonOptions = {
  bundle: true,
  format: 'esm',
  splitting: true,         // 코드 분할 (ESM only)
  tsconfig: './tsconfig.json',
  outdir: path.join(OUT, 'js'),

  // 출력 파일명 패턴
  entryNames: '[name].[hash].bundle',
  chunkNames: 'vendor-[name]-[hash]',
  assetNames: '../static/[name]-[hash]',

  // 소스맵
  sourcemap: isLive ? false : true,

  // JS minify
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,

  // Tree shaking
  treeShaking: true,

  // 환경변수 주입 (process.env.X 형태)
  define: {
    'process.env.BUILD_TYPE':   JSON.stringify(BUILD_TYPE),
    'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
    'process.env.NODE_ENV':     JSON.stringify(NODE_ENV),
    'process.env.STATIC_LINK':  JSON.stringify(STATIC_LINK),
  },

  // JSX
  jsx: 'automatic',

  // Loader (자산 처리)
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.eot': 'file',
    '.ttf': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.svg': 'dataurl',   // 10KB 기준 분기가 필요하면 커스텀 plugin 사용
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.gif': 'dataurl',
  },

  // Path alias (수정 필요)
  alias: {
    '~public':     PUBLIC,
    '~common':     COMMON,
    '~src':        SRC,
    '~pages':      path.join(SRC, 'pages'),
    '~store':      path.join(SRC, 'store'),
    '~config':     path.join(SRC, 'config'),
    '~context':    path.join(SRC, 'context'),
    '~components': path.join(SRC, 'components'),
    '~layouts':    path.join(SRC, 'layouts'),
    '~utils':      path.join(SRC, 'utils'),
    '~hooks':      path.join(SRC, 'hooks'),
    '~api':        path.join(SRC, 'api'),
    '~constants':  path.join(SRC, 'constants'),
    '~dialogs':    path.join(SRC, 'dialogs'),
    '~css':        path.join(SRC, 'static/css'),
    '~images':     path.join(SRC, 'static/images'),
    '~language':   path.join(SRC, 'static/language'),
  },

  plugins: [
    // SCSS 처리
    sassPlugin(),

    // CSS Modules (.module.css, .module.scss)
    cssModulesPlugin({
      generateScopedName: '[local]__[hash:base64:5]',
    }),
  ],
};

// ─── 1단계: 메인 앱 빌드 ─────────────────────────────────────────────────────
console.log('[esbuild] 메인 앱 빌드 시작...');

await build({
  ...commonOptions,
  entryPoints: {
    app: path.join(SRC, 'index.tsx'),
    // [수정 필요] 난독화 대상 모듈을 별도 entry로 분리
    // 이렇게 하면 출력 파일명이 예측 가능해져서 후처리 난독화 적용이 쉬워짐
    'api-layer': path.join(COMMON, 'api/index.ts'),
  },
});

console.log('[esbuild] 메인 앱 빌드 완료.');

// ─── 2단계: CSS 파일 이동 ─────────────────────────────────────────────────────
// esbuild가 outdir/js/에 CSS도 출력하므로 styles/로 이동
const stylesDir = path.join(OUT, 'styles');
fs.mkdirSync(stylesDir, { recursive: true });

const cssFiles = globSync(path.join(OUT, 'js', '**/*.css'));
for (const file of cssFiles) {
  const dest = path.join(stylesDir, path.basename(file));
  fs.renameSync(file, dest);
}

// ─── 3단계: 난독화 후처리 (api-layer 파일만) ──────────────────────────────────
console.log('[obfuscator] 난독화 적용 중...');

// api-layer 출력 파일 찾기 (entryNames 패턴: api-layer.[hash].bundle.js)
const apiFiles = globSync(path.join(OUT, 'js', 'api-layer*.js'));

for (const file of apiFiles) {
  const code = fs.readFileSync(file, 'utf-8');
  const result = JavaScriptObfuscator.obfuscate(code, obfuscatorPresets.high);
  fs.writeFileSync(file, result.getObfuscatedCode());
  console.log(`[obfuscator] 난독화 완료: ${path.basename(file)}`);
}

// ─── 4단계: HTML 생성 (자산 경로 주입) ───────────────────────────────────────
console.log('[html] index.html 생성 중...');

let htmlContent = fs.readFileSync(HTML_ENTRY, 'utf-8');

// 환경변수 치환
htmlContent = htmlContent
  .replace(/%STATIC_LINK%/g, STATIC_LINK)
  .replace(/%SERVICE_TYPE%/g, SERVICE_TYPE)
  .replace(/%BUILD_TYPE%/g, BUILD_TYPE)
  .replace(/%STATIC_UPDATE_VERSION%/g, isLive ? Date.now().toString() : '');

// 빌드된 JS/CSS 파일 자동 삽입
const jsFiles = globSync(path.join(OUT, 'js', '*.bundle.js'))
  .map((f) => path.relative(OUT, f));
const cssFilesResult = globSync(path.join(OUT, 'styles', '*.css'))
  .map((f) => path.relative(OUT, f));

const scriptTags = jsFiles
  .map((f) => `  <script type="module" src="./${f}"></script>`)
  .join('\n');
const linkTags = cssFilesResult
  .map((f) => `  <link rel="stylesheet" href="./${f}">`)
  .join('\n');

htmlContent = htmlContent
  .replace('</head>', `${linkTags}\n</head>`)
  .replace('</body>', `${scriptTags}\n</body>`);

fs.writeFileSync(path.join(OUT, 'index.html'), htmlContent);

// ─── 5단계: public 디렉토리 복사 ─────────────────────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(PUBLIC, OUT);

console.log('[esbuild] 빌드 완료! 산출물:', OUT);

// ─── 빌드 결과 요약 ───────────────────────────────────────────────────────────
const allFiles = globSync(path.join(OUT, '**/*'), { nodir: true });
const totalSize = allFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
console.log(`\n총 파일 수: ${allFiles.length}`);
console.log(`총 크기: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

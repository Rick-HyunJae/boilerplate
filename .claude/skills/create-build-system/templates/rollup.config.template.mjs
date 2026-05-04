/**
 * rollup.config.template.mjs
 *
 * Self-contained Rollup 설정 템플릿 (Build 전용).
 * 외부 프로젝트에서 그대로 복사하여 사용 가능.
 *
 * [중요] 이 설정은 Build 전용입니다.
 * Dev server는 vite를 함께 사용하세요 (검증된 조합).
 * references/06-dev-server.md 참조.
 *
 * [수정 필요 항목]
 * - alias entries: 프로젝트 디렉토리 구조에 맞게 조정
 * - OBFUSCATE_INCLUDE: 난독화 적용할 파일 glob 패턴
 * - HTML_ENTRY: index.html 경로
 *
 * [설치 패키지]
 * # Build (rollup)
 * npm i -D rollup
 *           @rollup/plugin-typescript @rollup/plugin-babel @rollup/plugin-alias
 *           @rollup/plugin-replace @rollup/plugin-url @rollup/plugin-image
 *           @rollup/plugin-terser @rollup/plugin-html
 *           rollup-plugin-postcss rollup-plugin-obfuscator
 *           sass typescript dotenv cross-env
 *
 * # Dev (vite) - 조합 패턴
 * npm i -D vite @vitejs/plugin-react vite-tsconfig-paths
 *
 * [npm scripts]
 * "dev":          "cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago vite"
 * "dev:prod":     "cross-env HTTPS=true BUILD_TYPE=live SERVICE_TYPE=wehago vite"
 * "build:dev":    "cross-env NODE_ENV=production BUILD_TYPE=dev SERVICE_TYPE=wehago rollup --config rollup.config.mjs"
 * "build:prod":   "cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehago rollup --config rollup.config.mjs"
 * "build:wehagom":"cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehagom rollup --config rollup.config.mjs"
 */

import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import url from '@rollup/plugin-url';
import terser from '@rollup/plugin-terser';
import html from '@rollup/plugin-html';
import obfuscator from 'rollup-plugin-obfuscator';
import postcss from 'rollup-plugin-postcss';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// ─── 환경변수 (JS 주입용) ─────────────────────────────────────────────────────
const defineValues = {
  preventAssignment: true,
  values: {
    'process.env.BUILD_TYPE':   JSON.stringify(BUILD_TYPE),
    'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
    'process.env.NODE_ENV':     JSON.stringify(NODE_ENV),
    'process.env.STATIC_LINK':  JSON.stringify(STATIC_LINK),
  },
};

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

// 난독화 적용 대상 (수정 필요)
const OBFUSCATE_INCLUDE = ['**/common/api/**'];

// ─── HTML 처리 (환경변수 치환 포함) ──────────────────────────────────────────
function buildHtmlTemplate({ files }) {
  let template = fs.readFileSync(HTML_ENTRY, 'utf-8');

  // %VAR% 패턴 치환
  template = template
    .replace(/%STATIC_LINK%/g, STATIC_LINK)
    .replace(/%SERVICE_TYPE%/g, SERVICE_TYPE)
    .replace(/%BUILD_TYPE%/g, BUILD_TYPE)
    .replace(/%STATIC_UPDATE_VERSION%/g, isLive ? Date.now().toString() : '');

  // JS 파일 삽입
  const scripts = (files.js || [])
    .map((f) => `<script type="module" src="${f.fileName}"></script>`)
    .join('\n');

  // CSS 파일 삽입
  const styles = (files.css || [])
    .map((f) => `<link rel="stylesheet" href="${f.fileName}">`)
    .join('\n');

  return template
    .replace('</head>', `${styles}\n</head>`)
    .replace('</body>', `${scripts}\n</body>`);
}

// ─── 메인 설정 ───────────────────────────────────────────────────────────────
export default {
  input: path.join(SRC, 'index.tsx'),

  output: {
    dir: 'build',
    format: 'es',

    entryFileNames: 'js/[name].[hash].bundle.js',
    chunkFileNames: 'js/vendor-[name].[hash].js',
    assetFileNames: (assetInfo) => {
      const name = assetInfo.name ?? '';
      if (/\.(eot|ttf|woff|woff2)$/.test(name)) return 'static/font/[name]-[hash][extname]';
      if (/\.(svg|gif|png|jpe?g)$/.test(name)) return 'static/image/[name][extname]';
      if (/\.css$/.test(name)) return 'styles/[name].[hash][extname]';
      return 'static/[name]-[hash][extname]';
    },

    // 소스맵
    sourcemap: isLive ? false : true,

    // 코드 분할
    manualChunks: {
      'vendor-react': ['react', 'react-dom', 'react-router-dom'],
    },
  },

  plugins: [
    // TypeScript
    typescript({ tsconfig: './tsconfig.json' }),

    // Babel (JSX, 최신 문법)
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),

    // Path alias (수정 필요)
    alias({
      entries: [
        { find: '~public',     replacement: PUBLIC },
        { find: '~common',     replacement: COMMON },
        { find: '~src',        replacement: SRC },
        { find: '~pages',      replacement: path.join(SRC, 'pages') },
        { find: '~store',      replacement: path.join(SRC, 'store') },
        { find: '~config',     replacement: path.join(SRC, 'config') },
        { find: '~context',    replacement: path.join(SRC, 'context') },
        { find: '~components', replacement: path.join(SRC, 'components') },
        { find: '~layouts',    replacement: path.join(SRC, 'layouts') },
        { find: '~utils',      replacement: path.join(SRC, 'utils') },
        { find: '~hooks',      replacement: path.join(SRC, 'hooks') },
        { find: '~api',        replacement: path.join(SRC, 'api') },
        { find: '~constants',  replacement: path.join(SRC, 'constants') },
        { find: '~dialogs',    replacement: path.join(SRC, 'dialogs') },
        { find: '~css',        replacement: path.join(SRC, 'static/css') },
        { find: '~images',     replacement: path.join(SRC, 'static/images') },
        { find: '~language',   replacement: path.join(SRC, 'static/language') },
      ],
    }),

    // 환경변수 주입
    replace(defineValues),

    // CSS / SCSS / CSS Modules
    postcss({
      modules: true,
      extract: true,
      use: ['sass'],
      minimize: true,
    }),

    // 폰트 / 이미지 (10KB 기준 인라인/파일)
    url({
      include: ['**/*.eot', '**/*.ttf', '**/*.woff', '**/*.woff2'],
      limit: 10000,
      fileName: 'static/font/[name]-[hash][extname]',
    }),
    url({
      include: ['**/*.svg', '**/*.gif', '**/*.png', '**/*.jpg', '**/*.jpeg'],
      limit: 10000,
      fileName: 'static/image/[name][extname]',
    }),

    // HTML 진입점
    html({ template: buildHtmlTemplate }),

    // JS Minify
    terser({
      compress: { unused: true },
      format: { comments: false },
    }),

    // 난독화 (지정 경로만)
    obfuscator({
      include: OBFUSCATE_INCLUDE,
      exclude: ['node_modules/**'],
      options: obfuscatorPresets.high,
    }),
  ],
};

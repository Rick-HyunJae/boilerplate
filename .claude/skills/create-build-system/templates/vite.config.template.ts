/**
 * vite.config.template.ts
 *
 * Self-contained Vite 설정 템플릿.
 * 외부 프로젝트에서 그대로 복사하여 사용 가능.
 *
 * [수정 필요 항목]
 * - OBFUSCATE_INCLUDE: 난독화 적용할 파일 glob 패턴
 * - alias 목록: 프로젝트 디렉토리 구조에 맞게 조정
 * - HTML_ENTRY: index.html 경로 (기본: 프로젝트 루트)
 *
 * [설치 패키지]
 * npm i -D vite @vitejs/plugin-react sass
 *           vite-tsconfig-paths
 *           vite-plugin-javascript-obfuscator javascript-obfuscator
 *           vite-plugin-html
 *           cross-env
 *
 * [npm scripts]
 * "dev":          "cross-env BUILD_TYPE=dev SERVICE_TYPE=wehago vite"
 * "dev:prod":     "cross-env HTTPS=true BUILD_TYPE=live SERVICE_TYPE=wehago vite"
 * "dev:wehagom":  "cross-env HOST=test.samsunghospital.com BUILD_TYPE=live SERVICE_TYPE=wehagom vite"
 * "build:dev":    "cross-env NODE_ENV=production BUILD_TYPE=dev SERVICE_TYPE=wehago vite build"
 * "build:prod":   "cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehago vite build"
 * "build:wehagom":"cross-env NODE_ENV=production BUILD_TYPE=live SERVICE_TYPE=wehagom vite build"
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator';
import { createHtmlPlugin } from 'vite-plugin-html';
import path from 'path';

// ─── 난독화 프리셋 ─────────────────────────────────────────────────────────────
const obfuscatorPresets = {
  high: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    identifierNamesGenerator: 'hexadecimal' as const,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4' as const],
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
    identifierNamesGenerator: 'hexadecimal' as const,
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ['base64' as const],
    stringArrayThreshold: 0.75,
  },
  low: {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    identifierNamesGenerator: 'mangled' as const,
    selfDefending: false,
    stringArray: false,
  },
};

// ─── 외부 리소스 동적 생성 ────────────────────────────────────────────────────
function getStaticLink(buildType: string, serviceType: string): string {
  if (buildType === 'live') {
    return serviceType === 'wehagom'
      ? 'https://static.wehagov.com'
      : 'https://static.wehago.com';
  }
  return 'http://172.16.114.131';
}

export default defineConfig(({ mode }) => {
  // 환경변수 로딩 (모든 접두사 포함)
  const env = loadEnv(mode, process.cwd(), '');

  const BUILD_TYPE   = env.BUILD_TYPE   || 'dev';
  const SERVICE_TYPE = env.SERVICE_TYPE || 'wehago';
  const HTTPS        = env.HTTPS === 'true';
  const HOST         = env.HOST || 'localhost';
  const PORT         = Number(env.DEFAULT_PORT) || 3000;

  const isProduction = mode === 'production';
  const isLive       = BUILD_TYPE === 'live';
  const STATIC_LINK  = getStaticLink(BUILD_TYPE, SERVICE_TYPE);

  // HTML 진입점 (사용자 지정 가능)
  // 기본: 프로젝트 루트의 index.html
  // 변경 예: path.resolve(__dirname, 'src/index.html')
  const HTML_ENTRY = process.env.HTML_ENTRY || undefined;

  // 난독화 적용 대상 (수정 필요)
  const OBFUSCATE_INCLUDE = ['**/common/api/**', '**/src/api/**'];

  return {
    plugins: [
      react(), // JSX + React Fast Refresh

      tsconfigPaths(), // tsconfig.json의 paths를 자동으로 alias로 적용

      // HTML 변수 치환 (%STATIC_LINK% 등)
      createHtmlPlugin({
        inject: {
          data: {
            STATIC_LINK,
            SERVICE_TYPE,
            BUILD_TYPE,
            STATIC_UPDATE_VERSION: isLive ? Date.now().toString() : '',
          },
        },
      }),

      // 난독화 (프로덕션에서만)
      isProduction && javascriptObfuscator({
        include: OBFUSCATE_INCLUDE,
        exclude: ['node_modules/**'],
        options: obfuscatorPresets.high,
      }),
    ].filter(Boolean),

    // Path alias (tsconfigPaths 플러그인이 tsconfig.json paths를 읽으므로
    // 여기서 별도 설정 불필요. 추가 alias가 필요한 경우만 작성)
    resolve: {
      alias: {
        // 예시: '~public': path.resolve(__dirname, 'public'),
      },
    },

    // 환경변수 주입 (process.env.X 형태로 코드에서 사용 가능)
    define: {
      'process.env.BUILD_TYPE':   JSON.stringify(BUILD_TYPE),
      'process.env.SERVICE_TYPE': JSON.stringify(SERVICE_TYPE),
      'process.env.NODE_ENV':     JSON.stringify(mode),
      'process.env.STATIC_LINK':  JSON.stringify(STATIC_LINK),
    },

    // CSS 설정
    css: {
      modules: {
        generateScopedName: '[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          // 전역 SCSS 변수 자동 주입 (필요 시 경로 수정)
          // additionalData: `@import "src/styles/_variables.scss";`,
        },
      },
      devSourcemap: !isProduction,
    },

    // 개발 서버
    server: {
      port: PORT,
      host: HOST,
      https: HTTPS,
      open: HTTPS,
      historyFallback: true,
      // 정적 파일: publicDir (기본: 'public') 자동 서빙
    },

    // 정적 파일 디렉토리 (기본: 'public')
    publicDir: 'public',

    // 빌드 설정
    build: {
      outDir: 'build',
      emptyOutDir: true,
      assetsInlineLimit: 10000, // 10KB 이하 자산 base64 인라인

      // 소스맵: 환경별 차등
      sourcemap: !isProduction ? true : isLive ? false : 'inline',

      rollupOptions: {
        // HTML 진입점 변경 시 사용
        ...(HTML_ENTRY && { input: HTML_ENTRY }),

        output: {
          entryFileNames: isProduction
            ? 'js/[name].[hash].bundle.js'
            : '[name].bundle.js',
          chunkFileNames: isProduction
            ? 'js/vendor-[name].[hash].js'
            : '[name].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? '';
            if (/\.(eot|ttf|woff|woff2)$/.test(name)) {
              return 'static/font/[name]-[hash][extname]';
            }
            if (/\.(svg|gif|png|jpe?g)$/.test(name)) {
              return 'static/image/[name][extname]';
            }
            if (/\.css$/.test(name)) {
              return isProduction
                ? 'styles/[name].[hash][extname]'
                : 'styles/[name][extname]';
            }
            return 'static/[name]-[hash][extname]';
          },

          // 코드 분할 (vendor 청크 분리)
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              return 'vendor';
            }
          },
        },
      },

      // JS minify
      minify: isProduction ? 'esbuild' : false,
    },

    // 사전 번들 (vite가 자동 탐지 + 명시적 추가)
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };
});

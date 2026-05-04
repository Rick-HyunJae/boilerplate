/**
 * webpack.config.template.js
 *
 * Self-contained webpack 5 설정 템플릿.
 * 외부 프로젝트에서 그대로 복사하여 사용 가능.
 *
 * [수정 필요 항목]
 * - OBFUSCATE_PATHS: 난독화 적용할 디렉토리 목록
 * - DLL_CACHE_VERSION: DLL 캐시 버전 (날짜 형식 권장)
 * - BUILD_CACHE_VERSION: 빌드 캐시 버전
 * - alias 목록: 프로젝트 디렉토리 구조에 맞게 조정
 *
 * [설치 패키지]
 * npm i -D webpack webpack-cli webpack-dev-server webpack-merge
 *           babel-loader @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript
 *           @babel/plugin-transform-runtime @babel/plugin-transform-optional-chaining
 *           @babel/plugin-transform-nullish-coalescing-operator @babel/runtime
 *           ts-loader typescript
 *           css-loader style-loader mini-css-extract-plugin css-minimizer-webpack-plugin
 *           sass-loader sass
 *           file-loader url-loader
 *           html-webpack-plugin interpolate-html-plugin
 *           terser-webpack-plugin
 *           webpack-obfuscator javascript-obfuscator
 *           node-polyfill-webpack-plugin case-sensitive-paths-webpack-plugin
 *           react-refresh @pmmmwh/react-refresh-webpack-plugin
 *           cross-env dotenv
 */

'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('interpolate-html-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const dotenv = require('dotenv');

// ─── 환경 변수 ────────────────────────────────────────────────────────────────
const NODE_ENV     = process.env.NODE_ENV    || 'development';
const BUILD_TYPE   = process.env.BUILD_TYPE  || 'dev';
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'wehago';
const HTTPS        = process.env.HTTPS === 'true';
const HOST         = process.env.HOST || 'localhost';
const PORT         = Number(process.env.DEFAULT_PORT) || 3000;

const isProduction = NODE_ENV === 'production';
const isLive       = BUILD_TYPE === 'live';

// ─── 캐시 버전 (필요 시 수정) ─────────────────────────────────────────────────
const DLL_CACHE_VERSION   = '20260126';
const BUILD_CACHE_VERSION = '20260126';
const BUILD_CACHE_NAME    = `${NODE_ENV}_${SERVICE_TYPE}_${BUILD_TYPE}_${BUILD_CACHE_VERSION}`.toUpperCase();

// ─── 경로 ─────────────────────────────────────────────────────────────────────
const ROOT         = path.resolve(__dirname);
const SRC          = path.join(ROOT, 'src');
const COMMON       = path.join(ROOT, 'common');
const PUBLIC       = path.join(ROOT, 'public');
const BUILD        = path.join(ROOT, 'build');
const CACHE_DLL    = path.join(ROOT, 'webpack/cache/dll', `DLL_${DLL_CACHE_VERSION}`);
const CACHE_BUILD  = path.join(ROOT, 'webpack/cache/build', BUILD_CACHE_NAME);

// HTML 진입점 (사용자 지정 가능: 'src/index.html', 'public/index.html' 등)
const HTML_ENTRY   = process.env.HTML_ENTRY || path.join(PUBLIC, `${SERVICE_TYPE}.html`);

// ─── 외부 리소스 동적 생성 (서비스/환경별 분기) ──────────────────────────────
function getStaticLink(buildType, serviceType) {
  if (buildType === 'live') {
    return serviceType === 'wehagom'
      ? 'https://static.wehagov.com'
      : 'https://static.wehago.com';
  }
  return 'http://172.16.114.131';
}

const STATIC_LINK = getStaticLink(BUILD_TYPE, SERVICE_TYPE);

// ─── 환경변수 (JS + HTML 모두 주입) ──────────────────────────────────────────
const rawEnv = Object.assign({}, dotenv.config().parsed, process.env);
const defineEnv = {};
Object.keys(rawEnv).forEach((key) => {
  defineEnv[key] = JSON.stringify(rawEnv[key]);
});
defineEnv['STATIC_LINK'] = JSON.stringify(STATIC_LINK);

const htmlEnv = {
  SERVICE_TYPE,
  BUILD_TYPE,
  STATIC_LINK,
  STATIC_UPDATE_VERSION: isLive ? Date.now().toString() : '',
};

// ─── 난독화 설정 ──────────────────────────────────────────────────────────────
// [수정 필요] 난독화 적용할 경로 목록
const OBFUSCATE_PATHS = [
  path.join(COMMON, 'api'),
];

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

// ─── CSS Loader ───────────────────────────────────────────────────────────────
function getCSSLoaders(useModules = false) {
  const loaders = [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'css-loader',
      options: {
        sourceMap: !isProduction,
        ...(useModules && {
          modules: {
            getLocalIdent: (context, localIdentName, localName) => {
              const hash = Buffer.from(context.resourcePath + localName)
                .toString('base64').slice(0, 5).replace(/[^a-zA-Z0-9]/g, '_');
              return `${localName}__${hash}`;
            },
          },
        }),
      },
    },
  ];
  return loaders;
}

// ─── Module Rules ─────────────────────────────────────────────────────────────
function getModuleRules() {
  const jsRule = isProduction && OBFUSCATE_PATHS.length > 0
    ? [
        // 일반 JS/TS (난독화 미적용)
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: [/node_modules/, ...OBFUSCATE_PATHS],
          use: ['babel-loader', 'ts-loader'],
        },
        // 난독화 대상 (api 등)
        {
          test: /\.(js|ts|tsx)$/,
          include: OBFUSCATE_PATHS,
          enforce: 'post',
          use: [
            { loader: WebpackObfuscator.loader, options: obfuscatorPresets.high },
            'babel-loader',
            'ts-loader',
          ],
        },
      ]
    : [
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader', 'ts-loader'],
        },
      ];

  return [
    ...jsRule,
    // CSS
    { test: /\.css$/, exclude: /\.module\.css$/, use: getCSSLoaders() },
    { test: /\.module\.css$/, use: getCSSLoaders(true) },
    // SCSS
    { test: /\.(scss|sass)$/, exclude: /\.module\.(scss|sass)$/, use: [...getCSSLoaders(), 'sass-loader'] },
    { test: /\.module\.(scss|sass)$/, use: [...getCSSLoaders(true), 'sass-loader'] },
    // JSON
    { test: /\.json$/, type: 'json' },
    // 폰트
    { test: /\.(eot|ttf|woff|woff2)$/, use: [{ loader: 'url-loader', options: { limit: 10000, name: 'static/font/[name]-[hash].[ext]' } }] },
    // 이미지
    { test: /\.(svg|gif|png|jpe?g)$/, use: [{ loader: 'url-loader', options: { limit: 10000, name: 'static/image/[name].[ext]' } }] },
  ];
}

// ─── Plugins ─────────────────────────────────────────────────────────────────
function getPlugins() {
  return [
    new HtmlWebpackPlugin({
      template: HTML_ENTRY,
      filename: 'index.html',
      minify: isProduction ? { collapseWhitespace: true, removeComments: true } : false,
    }),
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, htmlEnv),
    new webpack.DefinePlugin({ 'process.env': defineEnv }),
    new MiniCssExtractPlugin({
      filename: isProduction ? 'styles/[name].[contenthash:10].css' : 'styles/[name].css',
    }),
    new CaseSensitivePathsPlugin(),
    new NodePolyfillPlugin(),
    ...(isProduction ? [] : [
      new webpack.HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin(),
    ]),
  ];
}

// ─── 메인 설정 ───────────────────────────────────────────────────────────────
module.exports = {
  mode: NODE_ENV,

  entry: path.join(SRC, 'index.tsx'),

  devtool: !isProduction
    ? 'eval-source-map'
    : isLive ? false : 'eval-cheap-module-source-map',

  output: {
    path: isProduction ? BUILD : undefined,
    publicPath: isProduction ? './' : '/',
    filename: isProduction
      ? 'js/[name].[contenthash:10].bundle.js'
      : '[name].bundle.js',
    ...(isProduction && {
      chunkFilename: 'js/vendor-[name].[contenthash:10].js',
      clean: true,
    }),
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      // [수정 필요] 프로젝트 구조에 맞게 조정
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
  },

  module: { rules: getModuleRules() },

  plugins: getPlugins(),

  optimization: isProduction ? {
    runtimeChunk: { name: (entry) => `runtime-${entry.name}` },
    removeEmptyChunks: true,
    removeAvailableModules: true,
    splitChunks: {
      chunks: 'all',
      minChunks: 2,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
    },
    minimizer: [
      new TerserPlugin({
        parallel: 4,
        extractComments: false,
        terserOptions: {
          mangle: true,
          compress: { ecma: 5, unused: true },
          format: { ecma: 5, comments: false },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  } : { emitOnErrors: true },

  cache: isProduction
    ? {
        type: 'filesystem',
        name: BUILD_CACHE_NAME,
        version: BUILD_CACHE_VERSION,
        cacheLocation: CACHE_BUILD,
        compression: 'gzip',
        idleTimeout: 60000,
        idleTimeoutForInitialStore: 5000,
      }
    : { type: 'memory' },

  devServer: isProduction ? undefined : {
    compress: true,
    hot: true,
    historyApiFallback: true,
    port: PORT,
    host: HOST,
    open: HTTPS,
    server: HTTPS ? 'https' : 'http',
    static: { directory: PUBLIC, publicPath: '/' },
  },

  performance: isProduction ? {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  } : undefined,
};

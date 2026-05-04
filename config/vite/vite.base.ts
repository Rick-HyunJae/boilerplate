import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

import { loadValidatedEnv } from '../env';

import type { UserConfig } from 'vite';
import type { HtmlTagDescriptor } from 'vite';

/** 프로젝트 루트 절대 경로. Vite `root` 옵션과 플러그인 경로 계산에 사용한다. */
export const root = path.resolve(import.meta.dirname, '../..');

/** .env 파일 디렉토리 절대 경로. Vite `envDir` 및 `loadValidatedEnv` 에 전달한다. */
export const envDir = path.resolve(import.meta.dirname, '../env');

/** 정적 에셋 디렉토리 절대 경로. dev 서버에서 `/assets/...` 로 서빙되며 빌드 시 `dist/` 로 그대로 복사된다. */
export const publicDir = path.resolve(root, 'public');

const devMetaTags: HtmlTagDescriptor[] = [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }];

const prodMetaTags: HtmlTagDescriptor[] = [
    { tag: 'meta', attrs: { name: 'robots', content: 'index, follow' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'description', content: 'CSR Boilerplate' }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:title', content: 'CSR Boilerplate' }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:description', content: 'CSR Boilerplate' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:title', content: 'CSR Boilerplate' }, injectTo: 'head' },
    { tag: 'meta', attrs: { 'http-equiv': 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
];

/**
 * @description 모든 환경(dev/prod)에 공통 적용되는 Vite 기본 설정
 * `@` alias, TailwindCSS, React 플러그인, 환경변수 검증, HTML 처리를 포함한다
 *
 * @param mode {string} Vite 실행 모드 ('dev' | 'prod')
 * @param command {string} Vite 실행 커맨드 ('build' | 'serve')
 *
 * @returns Vite UserConfig (공통)
 */
export default function base({ mode, command }: { mode: string; command: string }): UserConfig {
    const env = loadValidatedEnv(mode, envDir);
    const isProd = mode === 'prod';
    const isBuild = command === 'build';

    return {
        root,
        publicDir,
        envDir,
        resolve: {
            alias: {
                '@': path.resolve(root, 'src'),
            },
        },
        plugins: [
            tailwindcss(),
            react(),
            createHtmlPlugin({
                minify: isBuild,
                entry: '/src/main.tsx',
                template: 'public/index.html',
                inject: {
                    data: { ...env },
                    tags: isProd ? prodMetaTags : devMetaTags,
                },
            }),
        ],
        css: {
            preprocessorOptions: {
                scss: {},
            },
        },
    };
}

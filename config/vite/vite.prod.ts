import { copyAssetsPlugin } from './plugins/static-assets/copyAssets';
import { obfuscatorPlugin } from './plugins/code-obfuscator/obfuscator';
import { loadValidatedEnv } from '../env';
import { envDir } from './vite.base';

import type { UserConfig } from 'vite';

/**
 * @description 배포 빌드(vite build) 전용 Vite 설정
 *
 * - minify: 'oxc' — Rust 기반 미니파이어. esbuild 대비 ~2x 빠르며 Vite 8 기본 권장값
 * - manualChunks: vendor 청크를 앱 코드와 분리해 배포 시 변경 없는 라이브러리의
 *   브라우저 캐시를 보존한다
 * - sourcemap: dev 모드는 true(포함), prod 모드는 'hidden'(외부 보관, 에러 추적용)
 *
 * @param mode {string} Vite 실행 모드 ('dev' | 'prod')
 */
export default function prod({ mode }: { mode: string }): UserConfig {
    const env = loadValidatedEnv(mode, envDir);

    return {
        plugins: [copyAssetsPlugin(), obfuscatorPlugin({ enabled: env.VITE_OBFUSCATE === 'true' })],
        build: {
            target: 'es2022',
            sourcemap: mode === 'prod' ? 'hidden' : true,
            minify: 'oxc',
            reportCompressedSize: false,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('node_modules/react-router')) {
                            return 'vendor-router';
                        }
                        if (id.includes('node_modules/@tanstack')) {
                            return 'vendor-query';
                        }
                    },
                    entryFileNames: 'js/[name]-[hash].js',
                    chunkFileNames: 'js/[name]-[hash].js',
                    assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
                },
            },
        },
    };
}

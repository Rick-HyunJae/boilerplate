import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const root = path.resolve(import.meta.dirname, '../..');

/**
 * @description Vitest 테스트 설정
 * index.ts barrel 파일은 커버리지에서 제외 - barrel에 로직을 두지 않는 규약을 강제한다
 * setupFiles: jsdom 환경 초기화 및 Testing Library 커스텀 matcher 등록
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(root, 'src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [path.resolve(root, 'src/shared/test/setup.ts')],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/shared/test/', '**/*.d.ts', '**/*.config.*', '**/index.ts'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
});

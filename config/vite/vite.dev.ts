import basicSsl from '@vitejs/plugin-basic-ssl';

import type { UserConfig } from 'vite';

/**
 * @description 개발 서버(vite serve) 전용 Vite 설정
 * mode가 'prod'(pnpm start:prod)일 때 basicSsl로 HTTPS를 활성화한다
 * 카카오·네이버 소셜 로그인 등 HTTPS를 요구하는 서드파티 SDK를 로컬에서 테스트할 때 사용한다
 *
 * @param mode {string} Vite 실행 모드 ('dev' | 'prod')
 */
export default function dev({ mode }: { mode: string }): UserConfig {
    const useHttps = mode === 'prod';

    return {
        server: {
            port: 3000,
            open: true,
        },
        build: {
            sourcemap: 'inline',
        },
        plugins: [...(useHttps ? [basicSsl()] : [])],
    };
}

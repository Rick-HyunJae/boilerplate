import { loadEnv } from 'vite';
import { z } from 'zod';

/**
 * @description Vite 빌드·서버 시작 전 검증되는 환경변수 스키마
 * 잘못된 값이 런타임 오류로 이어지지 않도록 빌드 시점에 실패를 강제한다(fail-fast)
 */
export const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_APP_MODE: z.enum(['dev', 'prod']),
    VITE_APP_TITLE: z.string(),
    VITE_OBFUSCATE: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_HTTPS: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_MOCK: z.enum(['true', 'false']).default('false'),
    VITE_BUILD_TYPE: z.enum(['dev', 'live']),
    VITE_SERVICE_TYPE: z.enum(['default', 'alt']),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * @description Vite 설정 평가 시점(빌드·서버 시작 전)에 환경변수를 로드하고 Zod 스키마로 검증한다
 * 잘못된 환경변수로 인한 런타임 오류 대신 빌드 실패로 조기에 감지한다(fail-fast)
 *
 * @param mode {string} Vite 모드 ('dev' | 'prod')
 * @param envDir {string} .env 파일이 위치한 디렉토리 경로
 *
 * @returns 검증된 환경변수 객체
 * @throws 스키마 검증 실패 시 에러
 */
export function loadValidatedEnv(mode: string, envDir: string): AppEnv {
    const raw = loadEnv(mode, envDir, 'VITE_');
    const result = envSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(`[env] Invalid environment variables for mode "${mode}":\n${result.error.message}`);
    }

    return result.data;
}

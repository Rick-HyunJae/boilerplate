import rollupObfuscator from 'rollup-plugin-obfuscator';
import path from 'path';

import type { PluginOption } from 'vite';

export type ObfuscateLevel = 'low' | 'medium' | 'high';

/**
 * @description `obfuscatorPlugin` 에 전달하는 난독화 옵션
 *  - enabled: 난독화 활성 여부. false이면 플러그인을 등록하지 않는다
 *  - level: 난독화 강도 ('low' | 'medium' | 'high'). 기본값: 'medium'
 *  - include: 난독화를 적용할 경로 목록 (`path.resolve` 기반 절대경로 glob). 기본값: src/ 전체
 *  - exclude: 난독화에서 제외할 경로 목록. 기본값: node_modules, 테스트 파일
 */
export interface ObfuscatorPluginOptions {
    enabled: boolean;
    level?: ObfuscateLevel;
    include?: string[];
    exclude?: string[];
}

const levelPresets = {
    low: {
        compact: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
    },
    medium: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        stringArray: true,
        stringArrayThreshold: 0.75,
    },
    high: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        selfDefending: true,
        stringArray: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stringArrayEncoding: ['rc4'] as any,
        stringArrayThreshold: 1.0,
    },
};

const defaultRoot = path.resolve(import.meta.dirname, '../../..');

/**
 * @description VITE_OBFUSCATE 환경변수가 'true'일 때 JS 난독화를 적용하는 Rollup 플러그인
 * 빌드 post 단계에서만 실행된다
 *
 * 난독화 레벨:
 * - low:    CI 빌드 시간이 중요할 때. string array 치환만 적용
 * - medium: 기본값. 제어 흐름 평탄화 + 데드코드 삽입으로 역공학 비용을 높인다
 * - high:   금융·DRM 등 소스 보호가 필수인 경우. 빌드 시간 2~3배 증가
 *
 * @param opts {ObfuscatorPluginOptions} 난독화 플러그인 옵션
 *  - enabled: 난독화 활성 여부. false이면 플러그인을 등록하지 않는다
 *  - level: 난독화 강도. 기본값: 'medium'
 *  - include: 난독화를 적용할 경로 목록. 기본값: src/ 전체
 *  - exclude: 난독화에서 제외할 경로 목록. 기본값: node_modules, 테스트 파일
 */
export function obfuscatorPlugin(opts: ObfuscatorPluginOptions): PluginOption {
    if (!opts.enabled) return [];

    const level = opts.level ?? 'medium';
    const include = opts.include ?? [path.resolve(defaultRoot, 'src/**')];
    const exclude = opts.exclude ?? ['node_modules/**', '**/*.test.*', '**/*.spec.*'];

    const plugin = rollupObfuscator({
        include,
        exclude,
        options: levelPresets[level],
    });

    return {
        ...plugin,
        apply: 'build' as const,
        enforce: 'post' as const,
    };
}

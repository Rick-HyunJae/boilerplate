import { viteStaticCopy } from 'vite-plugin-static-copy';

import { copyTargets } from './copy.targets';

import type { PluginOption } from 'vite';

/**
 * @description `copy.targets.ts` 의 대상 목록을 dist/ 로 복사하는 Vite 플러그인
 * 대상이 없으면 플러그인을 등록하지 않아 불필요한 빌드 단계를 생략한다
 *
 * @returns Vite 플러그인 옵션
 */
export function copyAssetsPlugin(): PluginOption {
    if (copyTargets.length === 0) return [];

    return viteStaticCopy({ targets: copyTargets });
}

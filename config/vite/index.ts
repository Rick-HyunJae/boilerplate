import { defineConfig, mergeConfig } from 'vite';

import base from './vite.base';
import dev from './vite.dev';
import prod from './vite.prod';

/**
 * @description Vite 설정 진입점
 * `build` 커맨드는 mode(dev/prod)와 무관하게 항상 prod 빌드 설정을 사용한다
 * dev 모드 배포 빌드(pnpm build:dev)도 oxc 최소화·청크 분리 최적화가 필요하며,
 * dev/prod 환경 차이는 mode 값을 통해 플러그인 내부에서 처리한다
 */
export default defineConfig(({ mode, command }) => {
    const layered = command === 'build' ? prod({ mode }) : dev({ mode });
    return mergeConfig(base({ mode, command }), layered);
});

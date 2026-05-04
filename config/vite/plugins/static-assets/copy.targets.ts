import type { TransformOption } from 'vite-plugin-static-copy';

export interface CopyTarget {
    src: string;
    dest: string;
    rename?: string;
    transform?: TransformOption;
}

/**
 * @description 빌드 시 dist/ 하위로 복사할 파일/디렉토리 목록
 * src는 프로젝트 루트 기준 glob 또는 경로,
 * dest는 dist/ 기준 상대 경로 ('' 이면 dist/ 직하)
 *
 * 사용 예:
 *   { src: 'public-extra/**', dest: '' }
 *   { src: 'legacy/sdk.js', dest: 'vendor' }
 */
export const copyTargets: CopyTarget[] = [
    // { src: 'public-extra/**', dest: '' },
];

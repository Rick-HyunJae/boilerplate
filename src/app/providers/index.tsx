import { QueryClient } from '@tanstack/react-query';

/**
 * @description 앱 전역 TanStack Query 클라이언트
 *
 * - staleTime 60s: 페이지 이동 시 캐시된 데이터를 즉시 사용해 불필요한 재요청을 방지한다
 * - retry 1: 네트워크 순간 오류를 자동 복구하되, 2회 이상은 UX 응답 지연을 유발한다
 * - refetchOnWindowFocus false: 탭 전환마다 재요청되는 것을 방지해 API 서버 부하를 줄인다
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

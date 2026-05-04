/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ReactNode } from 'react';

/**
 * @description 테스트 전용 QueryClient. retry와 캐시를 비활성화해 테스트 격리를 보장한다
 */
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: 0 },
            mutations: { retry: false },
        },
    });
}

function AllProviders({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * @description @testing-library/react의 render를 래핑한 커스텀 렌더 함수
 * QueryClientProvider 등 전역 Provider를 자동으로 주입해 테스트 보일러플레이트를 제거한다
 * 반드시 @testing-library/react 대신 @/shared/test/utils에서 import해야 한다
 */
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

import type { RequestInterceptor } from './types';

interface InterceptorHandler<T = any> {
    id: number;
    fulfilled?: T;
    rejected?: (error: any) => any;
}

/**
 * Interceptor를 관리하는 클래스 (axios의 interceptor 구조를 모방)
 *
 * 주요 기능:
 * - 고유 ID 기반 interceptor 등록/제거
 * - 타입 안전한 핸들러 관리
 * - 순차적 실행 보장
 * - 메모리 관리
 */
export class InterceptorManager<T = any> {
    private handlers: Map<number, InterceptorHandler<T>> = new Map();
    private nextId: number = 0;

    /**
     * Interceptor 등록
     *
     * @param fulfilled - 성공 시 실행될 핸들러
     * @param rejected - 실패 시 실행될 핸들러
     * @returns 등록된 interceptor의 고유 ID
     *
     * @example
     * const id = interceptorManager.use(
     *   (config) => {
     *     config.headers.Authorization = 'Bearer token';
     *     return config;
     *   },
     *   (error) => {
     *     console.error('Request failed:', error);
     *     return Promise.reject(error);
     *   }
     * );
     */
    use(fulfilled?: T, rejected?: (error: any) => any): number {
        const id = this.nextId++;

        this.handlers.set(id, { id, fulfilled, rejected });

        return id;
    }

    /**
     * Interceptor 제거
     *
     * @param id - 제거할 interceptor의 ID
     * @returns {boolean} 제거 성공 여부
     *
     * @example
     * const id = interceptorManager.use(handler);
     * const removed = interceptorManager.eject(id); // true
     * const removedAgain = interceptorManager.eject(id); // false (이미 제거됨)
     */
    eject(id: number): boolean {
        // ID 유효성 검증
        if (!this.handlers.has(id)) {
            console.warn(`Interceptor with ID ${id} not found`);
            return false;
        }

        // Map에서 완전히 제거하여 메모리 효율성 확보
        return this.handlers.delete(id);
    }

    /**
     * 등록된 모든 interceptor를 등록 순서대로 실행
     *
     * @param fn - 각 interceptor에 대해 실행할 함수
     * @returns Promise<void>
     *
     * rules:
     * - ID 순서대로 실행 (등록 순서 보장)
     * - 하나의 interceptor에서 에러 발생 시 전체 실행 중단
     * - rejected 핸들러가 있으면 에러 처리 후 계속 진행
     */
    async forEach<U>(fn: (handler: InterceptorHandler<T>) => U | Promise<U>): Promise<void> {
        // ID 순서로 정렬하여 등록 순서 보장
        const sortedHandlers = Array.from(this.handlers.values()).sort((a, b) => a.id - b.id);

        for (let i = 0; i < sortedHandlers.length; i++) {
            const handler = sortedHandlers[i];
            try {
                await fn(handler);
            } catch (error) {
                console.error(`Error executing interceptor ${handler.id}:`, error);

                if (handler.rejected) {
                    try {
                        await handler.rejected(error);
                    } catch (rejectedError) {
                        console.error(`Error in rejected handler for interceptor ${handler.id}:`, rejectedError);
                    }
                }

                throw error;
            }
        }
    }

    /**
     * 등록된 interceptor 목록 반환
     *
     * @returns 현재 등록된 모든 interceptor 핸들러의 복사본
     */
    getHandlers(): InterceptorHandler<T>[] {
        return Array.from(this.handlers.values()).sort((a, b) => a.id - b.id);
    }

    /**
     * 모든 interceptor 제거
     *
     * @returns {number} 제거된 interceptor 개수
     */
    clear(): number {
        const count = this.handlers.size;
        this.handlers.clear();

        return count;
    }

    /**
     * 등록된 interceptor 개수 반환
     *
     * @returns {number} 현재 등록된 interceptor 개수
     */
    size(): number {
        return this.handlers.size;
    }

    /**
     * 특정 ID의 interceptor 존재 여부 확인
     *
     * @param id - 확인할 interceptor ID
     * @returns 존재 여부
     */
    has(id: number): boolean {
        return this.handlers.has(id);
    }

    /**
     * 특정 ID의 interceptor 정보 반환
     *
     * @param id - 조회할 interceptor ID
     * @returns interceptor 핸들러 또는 undefined
     */
    get(id: number): InterceptorHandler<T> | undefined {
        return this.handlers.get(id);
    }
}

/**
 * @example
 * const requestManager = new RequestInterceptorManager();
 *
 * // 인증 토큰 자동 추가
 * requestManager.use((config) => {
 *   const token = localStorage.getItem('token');
 *   if (token) {
 *     config.headers = config.headers || {};
 *     config.headers.Authorization = `Bearer ${token}`;
 *   }
 *   return config;
 * });
 */
export class RequestInterceptorManager extends InterceptorManager<RequestInterceptor['onFulfilled']> {
    /**
     * Request interceptor 등록
     *
     * @param fulfilled - 요청 전처리 함수
     * @param rejected - 요청 에러 처리 함수
     * @returns 등록된 interceptor ID
     */
    use(fulfilled?: RequestInterceptor['onFulfilled'], rejected?: RequestInterceptor['onRejected']): number {
        return super.use(fulfilled, rejected);
    }
}

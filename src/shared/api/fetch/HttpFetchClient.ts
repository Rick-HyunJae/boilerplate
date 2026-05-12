import qs from 'qs';

import { RequestInterceptorManager } from './InterceptorManager';

import type { TFetchClientConfig, TFetchRequestConfig } from './types';

/**
 * Fetch 기반 HTTP 클라이언트 (axios의 구조를 모방)
 *
 * 주요 기능:
 * - Request Interceptor 지원 (Response Interceptor는 native 기능을 위해 지원하지 않음)
 * - 추가 request property
 *    - baseURL
 *    - timeout
 *    - withCredentials
 */
export class HttpFetchClient {
    private config: TFetchClientConfig;
    private defaultTimeout: number = 30 * 1000;

    // controller에 연결할 interceptor 초기화
    public interceptors: {
        request: RequestInterceptorManager;
    };

    constructor(config: TFetchClientConfig = {}) {
        this.config = { ...config };

        this.interceptors = {
            request: new RequestInterceptorManager(),
        };
    }

    /**
     * URL과 파라미터를 조합하여 완전한 URL 생성
     *
     * 처리 과정:
     * 1. baseURL과 상대 URL 결합
     * 2. 쿼리 파라미터를 URLSearchParams로 변환
     * 3. 최종 URL 문자열 반환
     *
     * @param url - 기본 URL 또는 상대 경로
     * @param params - 쿼리 파라미터 객체
     * @returns 완성된 URL 문자열
     */
    private buildURL(url: string, params?: Record<string, any>): string {
        const baseURL = this.config.baseURL || '';
        const fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

        // 파라미터가 없으면 URL 그대로 반환
        if (!params || Object.keys(params).length === 0) {
            return fullURL;
        }

        const queryString = qs.stringify(params, { encode: true, skipNulls: false });

        // 기존 URL에 쿼리가 있는지 확인하여 적절한 구분자 사용
        const separator = fullURL.includes('?') ? '&' : '?';
        return queryString ? `${fullURL}${separator}${queryString}` : fullURL;
    }

    /**
     * Request body 데이터 처리
     *
     * 지원 데이터 타입:
     * - FormData: 그대로 전송 (multipart/form-data)
     * - Object: JSON.stringify 후 전송 (application/json)
     * - String: 문자열로 전송
     *
     * @param data - 요청 본문 데이터
     * @param headers - 헤더 객체 (Content-Type 자동 설정을 위해 참조로 전달)
     * @returns 처리된 요청 본문 또는 null
     */
    private processRequestData(data: any, headers: Headers): BodyInit | null {
        if (!data) return null;

        // FormData인 경우 그대로 반환 (브라우저가 자동으로 Content-Type 설정)
        if (data instanceof FormData) {
            return data;
        }

        // 객체인 경우 JSON으로 직렬화하고 Content-Type 설정
        if (typeof data === 'object') {
            headers.set('Content-Type', 'application/json');

            return JSON.stringify(data);
        }

        // 문자열인 경우 그대로 반환
        return String(data);
    }

    /**
     * Response 데이터 파싱
     * NOTE: stream과 같은 fetch native 기능을 사용하기 위해 추가적인 파싱 없이 response 그대로 반환
     *
     * @param response - Fetch Response 객체
     * @returns
     */
    private async processResponseData(url: string, requestOptions: RequestInit): Promise<any> {
        return await fetch(url, requestOptions);
    }

    /**
     * Request interceptor 실행
     *
     * @param config - 원본 요청 설정
     * @returns 처리된 요청 설정
     */
    private async executeRequestInterceptors(config: TFetchRequestConfig): Promise<TFetchRequestConfig> {
        let processedConfig = { ...config };

        await this.interceptors.request.forEach(async (interceptor) => {
            if (interceptor?.fulfilled) {
                try {
                    processedConfig = await interceptor.fulfilled(processedConfig);
                } catch (error) {
                    if (interceptor.rejected) {
                        await interceptor.rejected(error);
                    }
                    throw error;
                }
            }
        });

        return processedConfig;
    }

    /**
     * 타임아웃 처리를 위한 AbortController 생성
     * NOTE: fetch API는 자체 타임아웃 기능이 없으므로 AbortController를 사용하여 타임아웃 구현
     *
     * @param timeout
     * @returns AbortController instance
     */
    private createTimeoutController(timeout: number): AbortController {
        const controller = new AbortController();

        setTimeout(() => controller.abort(), timeout);

        return controller;
    }

    /**
     * 메인 요청 메서드
     *
     * 전체 요청 처리 프로세스:
     * 1. Request interceptor 실행
     * 2. 헤더 및 URL, Request body 구성
     * 3. abort controller 및 timeout 설정
     * 4. Fetch 전체 옵션 구성 및 실행
     *
     * @param config - 요청 설정
     * @returns Promise<Response>
     */
    async request(config: TFetchRequestConfig): Promise<Response> {
        // NOTE: controller의 config와 request의 config를 병합하여 interceptor에 전달
        const processedConfig = await this.executeRequestInterceptors({ ...this.config, ...config });

        // request 정보 구성
        const headers = new Headers({
            ...this.config.headers, // 전역 헤더
            ...processedConfig.headers, // 요청별 헤더 (우선순위 높음)
        });
        const url = this.buildURL(processedConfig.url, processedConfig.params);
        const body = this.processRequestData(processedConfig.data, headers);

        // 타임아웃 설정 (요청별 > 전역 > 기본값)
        const timeout = processedConfig.timeout || this.config.timeout || this.defaultTimeout;
        const timeoutController = this.createTimeoutController(timeout);
        const signal = processedConfig.signal || timeoutController.signal;

        // request 옵션 구성
        const requestOptions: RequestInit = {
            method: processedConfig.method || 'GET',
            headers,
            body,
            signal,
            credentials: this.config.withCredentials ? 'include' : 'same-origin',
        };

        try {
            return this.processResponseData(url, requestOptions);
        } catch (error) {
            // await this.interceptors.response.forEach(async (interceptor) => {
            // 	if (interceptor?.rejected) {
            // 		await interceptor.rejected(error);
            // 	}
            // });

            throw error;
        } finally {
            timeoutController.abort();
        }
    }

    /* ------------------------------ HTTP 메서드별 함수 ------------------------------ */
    /**
     * GET 요청
     * @param url
     * @param config
     */
    get(url: string, config?: Omit<TFetchRequestConfig, 'url' | 'method'>): Promise<Response> {
        return this.request({ ...config, url, method: 'GET' });
    }

    /**
     * POST 요청
     * @param url
     * @param data
     * @param config
     */
    post(url: string, data?: any, config?: Omit<TFetchRequestConfig, 'url' | 'method' | 'data'>): Promise<Response> {
        return this.request({ ...config, url, method: 'POST', data });
    }

    /**
     * PUT 요청
     * @param url
     * @param data
     * @param config
     */
    put(url: string, data?: any, config?: Omit<TFetchRequestConfig, 'url' | 'method' | 'data'>): Promise<Response> {
        return this.request({ ...config, url, method: 'PUT', data });
    }

    /**
     * DELETE 요청
     * @param url
     * @param config
     */
    delete(url: string, config?: Omit<TFetchRequestConfig, 'url' | 'method'>): Promise<Response> {
        return this.request({ ...config, url, method: 'DELETE' });
    }

    /**
     * PATCH 요청
     * @param url
     * @param data
     * @param config
     */
    patch(url: string, data?: any, config?: Omit<TFetchRequestConfig, 'url' | 'method' | 'data'>): Promise<Response> {
        return this.request({ ...config, url, method: 'PATCH', data });
    }
}

import { apiUrl } from '../config';
import type { TController } from '../types';
import { HttpFetchClient } from './HttpFetchClient';

import type { TFetchClientConfig } from './types';

const defaultAPIController = (options: TFetchClientConfig) =>
    new HttpFetchClient({
        ...options,
        baseURL: options.baseURL ?? apiUrl,
        withCredentials: true,
    });

/**
 * HttpFetchClient 인스턴스 생성 팩토리
 */
export function createController(type: TController, options?: TFetchClientConfig): HttpFetchClient {
    const _options = options ?? {};

    switch (type) {
        case 'basic':
            return new HttpFetchClient({ ..._options, baseURL: options?.baseURL ?? '' });
        case 'default':
            return defaultAPIController(_options);
        default:
            throw new Error('Invalid Controller Type');
    }
}

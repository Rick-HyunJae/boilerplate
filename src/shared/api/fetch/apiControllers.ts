import { apiUrl, unCertUrl, objectStorageUrl, dwUrl } from '../config';
import { HttpFetchClient } from './HttpFetchClient';

import type { TFetchClientConfig } from './types';

const serviceAPIController = (options: TFetchClientConfig) =>
    new HttpFetchClient({
        ...options,
        baseURL: options.baseURL ?? apiUrl,
        withCredentials: true,
    });

const objectStorageAPIController = (options: TFetchClientConfig) =>
    new HttpFetchClient({
        ...options,
        baseURL: options.baseURL ?? objectStorageUrl,
        withCredentials: true,
    });

const unCertAPIController = (options: TFetchClientConfig) =>
    new HttpFetchClient({
        ...options,
        baseURL: options.baseURL ?? unCertUrl,
        withCredentials: false,
    });

const dwAPIController = (options: TFetchClientConfig) =>
    new HttpFetchClient({
        ...options,
        baseURL: options.baseURL ?? dwUrl,
        withCredentials: true,
    });

/**
 * FetchController 인스턴스를 생성하는 팩토리 함수
 */
export function createController(type: 'gw' | 'objectStorage' | 'uncert' | 'dw' | 'basic', options?: TFetchClientConfig): HttpFetchClient {
    const _options = options ?? {};

    switch (type) {
        /**
         * 정해진 controller를 사용하지 않고, 기본 설정으로 사용
         */
        case 'basic':
            return new HttpFetchClient({ ..._options, baseURL: options?.baseURL ?? '' });

        /**
         * 인증 GW 설정을 적용한 controller
         */
        case 'gw':
            return serviceAPIController(_options);

        /**
         * common/object storage 설정을 적용한 controller
         */
        case 'objectStorage':
            return objectStorageAPIController(_options);

        /**
         * 비인증 GW 설정을 적용한 controller
         */
        case 'uncert':
            return unCertAPIController(_options);

        /**
         * DW(open domain) 설정을 적용한 controller
         */
        case 'dw':
            return dwAPIController(_options);

        default:
            throw new Error('Invalid Controller Type');
    }
}

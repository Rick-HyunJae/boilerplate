import { createRequestHeader, createUncertSignature } from '../util';

import type { InternalFetchRequestConfig, TFetchRequestConfig } from './types';

/**
 * 서비스 기본 GW 인증 템플릿
 * @param request
 */
const baseRequestHandler = (request: InternalFetchRequestConfig): TFetchRequestConfig => {
    const fullURL = `${request.baseURL}${request.url || ''}`;

    const requestHeaders = new Headers(request.headers);
    const existingAuth = requestHeaders.get('Authorization');

    const { wehago_sign, transactionId, Authorization, timestamp, cno } = createRequestHeader(fullURL);

    /**
     * 공통 설정: 시스템 관리 영역
     */
    requestHeaders.set('wehago-sign', wehago_sign);
    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);
    requestHeaders.set('cno', cno.toString());

    /**
     * 사용자 설정: 서비스 관리 영역
     * - Not Null: Authorization
     * - Nullable: Content-Type, service, client-id, method (필요 시, 서비스 API Controller에서 추가)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !existingAuth && requestHeaders.set('Authorization', Authorization);

    return { ...request, headers: Object.fromEntries(requestHeaders) };
};

/**
 * object storage signature 생성 API 요청 핸들러
 * @param request
 */
const objectStorageRequestHandler = (request: InternalFetchRequestConfig): TFetchRequestConfig => {
    const fullURL = `${request.baseURL}${request.url || ''}`;

    const requestHeaders = new Headers(request.headers);
    const existingAuth = requestHeaders.get('Authorization');
    const existingContentType = requestHeaders.get('Content-Type') || requestHeaders.get('content-type');

    const { wehago_sign, transactionId, Authorization, timestamp, cno } = createRequestHeader(fullURL);

    /**
     * 공통 설정: 시스템 관리 영역
     */
    requestHeaders.set('wehago-sign', wehago_sign);
    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);
    requestHeaders.set('cno', cno.toString());

    /**
     * 사용자 설정: 서비스 관리 영역
     * - Not Null: Authorization, Content-Type
     * - Nullable: service, client-id, method (필요 시, 서비스 API Controller에서 추가)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !existingAuth && requestHeaders.set('Authorization', Authorization);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !existingContentType && requestHeaders.set('Content-Type', 'application/x-www-form-urlencoded');

    return { ...request, headers: Object.fromEntries(requestHeaders) };
};

/**
 * 비인증 GW 인증이 필요한 API 요청 핸들러
 * @param request
 */
const uncertRequestHandler = async (request: InternalFetchRequestConfig): Promise<InternalFetchRequestConfig> => {
    const signature = await createUncertSignature(request.url!);

    const requestHeader = new Headers(request.headers ?? {});
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    signature && requestHeader.set('signature', signature);

    return { ...request, headers: Object.fromEntries(requestHeader) };
};

/**
 * dwapi API 요청 핸들러
 * @param request
 */
const dwRequestHandler = (request: InternalFetchRequestConfig): TFetchRequestConfig => {
    const requestHeader = new Headers(request.headers);

    return { ...request, headers: Object.fromEntries(requestHeader) };
};

/**
 * 요청 에러에 대한 핸들러 - 필요에 따라 서비스 내에서 커스텀해서 사용
 * @param error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestErrorHandler = (error: any): Promise<never> => {
    return Promise.reject(error);
};

export { baseRequestHandler, objectStorageRequestHandler, uncertRequestHandler, dwRequestHandler, requestErrorHandler };

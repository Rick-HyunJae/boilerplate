import { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

import { createRequestHeader, createUncertSignature } from './util';

/**
 * 서비스 기본 GW 인증 템플릿
 * @param request
 */
const baseRequestHandler = (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const fullURL = `${request.baseURL}${request.url || ''}`;

    const requestHeaders = new AxiosHeaders(request.headers);
    const existingAuth = requestHeaders.get('Authorization');

    const { wehago_sign, transactionId, Authorization, timestamp, cno } = createRequestHeader(fullURL);

    /**
     * 공통 설정: 시스템 관리 영역
     */
    requestHeaders.set('wehago-sign', wehago_sign);
    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);
    requestHeaders.set('cno', cno);

    /**
     * 사용자 설정: 서비스 관리 영역
     * - Not Null: Authorization
     * - Nullable: Content-Type, service, client-id, method (필요 시, 서비스 API Controller에서 추가)
     */
    !existingAuth && requestHeaders.set('Authorization', Authorization);

    return { ...request, headers: requestHeaders };
};

/**
 * object storage signature 생성 API 요청 핸들러
 * @param request
 */
const objectStorageRequestHandler = (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const fullURL = `${request.baseURL}${request.url || ''}`;

    const requestHeaders = new AxiosHeaders(request.headers);
    const existingAuth = requestHeaders.get('Authorization');
    const existingContentType = requestHeaders.get('Content-Type') || requestHeaders.get('content-type');

    const { wehago_sign, transactionId, Authorization, timestamp, cno } = createRequestHeader(fullURL);

    /**
     * 공통 설정: 시스템 관리 영역
     */
    requestHeaders.set('wehago-sign', wehago_sign);
    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);
    requestHeaders.set('cno', cno);

    /**
     * 사용자 설정: 서비스 관리 영역
     * - Not Null: Authorization, Content-Type
     * - Nullable: service, client-id, method (필요 시, 서비스 API Controller에서 추가)
     */
    !existingAuth && requestHeaders.set('Authorization', Authorization);
    !existingContentType && requestHeaders.set('Content-Type', 'application/x-www-form-urlencoded');

    return { ...request, headers: requestHeaders };
};

/**
 * 비인증 GW 인증이 필요한 API 요청 핸들러
 * @param request
 */
const uncertRequestHandler = async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const signature = await createUncertSignature(request.url!);

    const requestHeaders = new AxiosHeaders(request.headers);
    signature && requestHeaders.set('signature', signature);

    return { ...request, headers: requestHeaders };
};

/**
 * dwapi API 요청 핸들러
 * @param request
 */
const dwRequestHandler = (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const requestHeaders = new AxiosHeaders(request.headers);

    return { ...request, headers: requestHeaders };
};

/**
 * 서버로부터의 응답결과에 대한 핸들러 - 필요에 따라 서비스 내에서 커스텀해서 사용
 * @param response
 */
const responseHandler = (response: AxiosResponse): AxiosResponse => {
    return response;
};

/**
 * 요청 에러에 대한 핸들러 - 필요에 따라 서비스 내에서 커스텀해서 사용
 * @param error
 */
const requestErrorHandler = (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
};

/**
 * 응답 에러에 대한 핸들러
 * @param error
 */
const responseErrorHandler = (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
};

export { baseRequestHandler, objectStorageRequestHandler, uncertRequestHandler, dwRequestHandler, responseHandler, requestErrorHandler, responseErrorHandler };

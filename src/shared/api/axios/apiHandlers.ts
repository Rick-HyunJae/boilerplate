import { AxiosHeaders } from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { createRequestHeader } from '../util';

const baseRequestHandler = (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const requestHeaders = new AxiosHeaders(request.headers);
    const { transactionId, timestamp } = createRequestHeader();

    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);

    return { ...request, headers: requestHeaders };
};

const responseHandler = (response: AxiosResponse): AxiosResponse => response;

const requestErrorHandler = (error: AxiosError): Promise<AxiosError> => Promise.reject(error);
const responseErrorHandler = (error: AxiosError): Promise<AxiosError> => Promise.reject(error);

export { baseRequestHandler, responseHandler, requestErrorHandler, responseErrorHandler };

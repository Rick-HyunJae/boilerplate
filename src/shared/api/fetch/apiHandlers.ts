import { createRequestHeader } from '../util';

import type { InternalFetchRequestConfig, TFetchRequestConfig } from './types';

const baseRequestHandler = (request: InternalFetchRequestConfig): TFetchRequestConfig => {
    const requestHeaders = new Headers(request.headers);
    const { transactionId, timestamp } = createRequestHeader();

    requestHeaders.set('transaction-id', transactionId);
    requestHeaders.set('timestamp', timestamp);

    return { ...request, headers: Object.fromEntries(requestHeaders) };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestErrorHandler = (error: any): Promise<never> => Promise.reject(error);

export { baseRequestHandler, requestErrorHandler };

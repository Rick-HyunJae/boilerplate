/**
 * Fetch Controller Config
 */
export type TFetchClientConfig = {
    baseURL?: string;
    timeout?: number;
    headers?: HeadersInit;
    withCredentials?: boolean;
};

/**
 * Fetch Request option
 */
export type TFetchRequestConfig = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    params?: Record<string, any>;
    headers?: HeadersInit;
    signal?: AbortSignal;
    timeout?: number;
};

export interface InternalFetchRequestConfig extends TFetchRequestConfig, TFetchClientConfig {}

export interface RequestInterceptor {
    onFulfilled?: (config: InternalFetchRequestConfig) => TFetchRequestConfig | Promise<TFetchRequestConfig>;
    onRejected?: (error: any) => any;
}

export type RequestHandler = (config: TFetchRequestConfig) => TFetchRequestConfig | Promise<TFetchRequestConfig>;
export type ErrorHandler = (error: any) => any;

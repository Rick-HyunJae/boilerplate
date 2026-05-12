/**
 * @description EventSourcePolyfill 생성자 옵션
 */
export interface IEventSourcePolyfillOption {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string | number>;
    body?: BodyInit | null;
    withCredentials?: boolean;
}

/**
 * @description EventSourcePolyfill onopen 이벤트
 */
export interface IEventSourcePolyfillOpenEvent extends Event {
    status?: number;
    statusText?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * @description EventSourcePolyfill onmessage 이벤트
 */
export interface IEventSourcePolyfillMessageEvent extends MessageEvent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * @description EventSourcePolyfill onerror 이벤트
 */
export interface IEventSourcePolyfillErrorEvent extends Event {
    status?: number;
    statusText?: string;
    isJsonResponse?: boolean;
    data?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * @description EventSourcePolyfill 인스턴스 구조
 */
export interface IEventSourcePolyfill {
    readyState: number;
    onopen?: (event: IEventSourcePolyfillOpenEvent) => void | null;
    onmessage?: (event: IEventSourcePolyfillMessageEvent) => Promise<void> | void | null;
    onerror?: (event: IEventSourcePolyfillErrorEvent) => void | null;
    close(): void;
}

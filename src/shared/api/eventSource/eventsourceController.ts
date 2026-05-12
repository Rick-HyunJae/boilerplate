import { createRequestHeader } from '../util';
import { EventSourcePolyfill } from './eventsource';

import type {
    IEventSourcePolyfill,
    IEventSourcePolyfillErrorEvent,
    IEventSourcePolyfillMessageEvent,
    IEventSourcePolyfillOpenEvent,
    IEventSourcePolyfillOption,
} from './types';

export const eventSourceController = (url: string, options?: IEventSourcePolyfillOption): IEventSourcePolyfill => {
    const { transactionId, timestamp } = createRequestHeader();
    const requestHeaders = {
        Accept: '*/*',
        'transaction-id': transactionId,
        timestamp,
        'Content-Type': 'application/json',
        ...options?.headers,
    };

    const eventSource = new EventSourcePolyfill(url, { ...options, headers: requestHeaders });

    const controller: IEventSourcePolyfill = {
        get readyState() {
            return eventSource.readyState;
        },

        close() {
            eventSource.close();
        },
    };

    // 내부 이벤트 연결
    eventSource.onopen = (event: IEventSourcePolyfillOpenEvent) => {
        controller.onopen?.({ ...event });
    };
    eventSource.onmessage = (event: IEventSourcePolyfillMessageEvent) => {
        controller.onmessage?.({ ...event });
    };
    eventSource.onerror = (event: IEventSourcePolyfillErrorEvent) => {
        controller.onerror?.({
            ...event,
            status: event.status,
            isJsonResponse: event.isJsonResponse,
            data: event.data,
        });
    };

    return controller;
};

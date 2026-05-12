import { eventSourceController } from '../eventSource';

export const createExampleEventSource = (url: string) => {
    const source = eventSourceController(url);
    source.onopen = () => {};
    source.onmessage = () => {};
    source.onerror = () => {};
    return source;
};

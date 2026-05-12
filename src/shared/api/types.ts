import type { AxiosRequestHeaders } from 'axios';

declare global {
    interface Navigator {
        msSaveBlob: (blobOrBase64: Blob | string, filename: string) => void; // IE 다운로드 : 다운로드 시, 열기버튼 미제공
        msSaveOrOpenBlob: (blobOrBase64: Blob | string, filename: string) => void; // IE 다운로드 : 다운로드 시, 열기버튼 제공
    }
}

/**
 * basic : 기본 axios 형태로 새롭게 생성
 * gw : gw를 통과하는 컨트롤러 생성
 * objectStorage : objectStorage를 통과해야 하는 컨트롤러 생성
 * uncert : 비인증 GW를 통과해야 하는 컨트롤러 생성
 * dw : 오픈 방화벽으로 동작하는 dw 컨트롤러 생성
 */
export type TController = 'basic' | 'gw' | 'objectStorage' | 'uncert' | 'dw';

export type TRequestHeader = AxiosRequestHeaders & {
    service: string;
    clientId?: string;
    contentType?: string;
    method?: string;
    cno?: string;
};

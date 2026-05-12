import axios from 'axios';
import CryptoJS from 'crypto-js';

import { unCertUrl } from './config';

import cookieUtil from '@/shared/lib/cookie';
import apiUtil from '@/shared/lib/http';
import browserUtil from '@/shared/lib/browser';
import downloadUtil from '@/shared/lib/download';

/**
 * 서비스 GW 통과 sign 생성 로직
 * @param url
 */
const createRequestHeader = (url: string): { wehago_sign: string; transactionId: string; Authorization: string; timestamp: string; cno: string | number } => {
    const timestamp = apiUtil.getTimestamp();

    const wehago_s = cookieUtil.getLatestCookie('wehago_s'); // 위하고 서버 쿠키 get
    const path = apiUtil.getLocation(url)!.pathname + apiUtil.getLocation(url)!.search;
    const transactionId = apiUtil.getTransactionId();
    const hash_data = path + timestamp + transactionId;
    const service_key = wehago_s! + timestamp;
    const secure_key = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(service_key));
    const wehago_sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(hash_data, secure_key));
    const cno = cookieUtil.getLatestCookie('h_selected_company_no') || '';

    return Object.freeze({ wehago_sign, transactionId, Authorization: `Bearer ${cookieUtil.getLatestCookie('AUTH_A_TOKEN')}`, timestamp, cno });
};

/**
 * 비인증 Signature 생성 함수
 * @param url
 */
const createUncertSignature = async (url: string): Promise<string> => {
    const token_url = `${unCertUrl}/get_token/?url=${url}`;
    const transactionId = apiUtil.getTransactionId();

    try {
        const response = await axios({
            method: 'get',
            url: token_url,
            headers: {
                'Content-Type': 'application/json',
                'transaction-id': transactionId,
            },
        });
        const isToken = response.data.token;
        const isDate = response.data.cur_date;

        const encText = `${url}${isDate}${isToken}`;
        return CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(encText));
    } catch (error) {
        console.error('Uncert Signature API Request failure: ', error);
        return '';
    }
};

/**
 * 암호화된 서비스 고유키 생성
 * ServiceCode+@@+timestampe 문자열을 고유 서비스 키(24자리)를 사용해 AES로 암호화 진행
 *
 * @param serviceCode 서비스 생성 시, 발급되는 서비스 코드
 * @param serviceKey 서비스 생성 시, 발급되는 고유값
 */
export const createEncryptServiceKey = (serviceCode: string, serviceKey: string): string | undefined => {
    const timestamp = apiUtil.getTimestamp();
    const key = CryptoJS.enc.Utf8.parse(serviceKey);
    const value = `${serviceCode}@@${timestamp}`;

    try {
        // ECB 모드로 암호화 (IV 없음)
        const encryptedValue = CryptoJS.AES.encrypt(value, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        });

        return encodeURIComponent(encryptedValue.ciphertext.toString(CryptoJS.enc.Base64));
    } catch {
        return undefined;
    }
};

/**
 * 외부 S3 저장소에서 데이터를 다운로드하는 로직
 * @param storageUrl 저장소 url
 * @param fileName 파일 이름 (공백은 _ 로 치환)
 * @param auth 저장소 접근 Authorization Key
 * @param date 저장소 접근 Date Key
 * @param callbacks - beforeLoadCallback: 파일 Load 전 콜백, afterLoadCallback 파일 Load 후 콜백, failLoadCallback 파일 Load 실패 시, 콜백
 */
const downloadFileFromS3 = (
    storageUrl: string,
    fileName: string,
    auth: string,
    date: string,
    callbacks?: { beforeLoadCallback?: () => void; afterLoadCallback?: () => void; failLoadCallback?: () => void }
) => {
    const browserType = browserUtil.detectBrowser();
    const convertFileName = fileName.replace(/\s/g, '_');

    const xhr = new XMLHttpRequest();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    callbacks?.beforeLoadCallback && callbacks.beforeLoadCallback();

    xhr.open('GET', storageUrl, true);

    // S3 접근 헤더
    xhr.setRequestHeader('Authorization', auth); // 필수
    xhr.setRequestHeader('x-amz-date', date); // 필수
    xhr.setRequestHeader('service', 'objectStorageService'); // 서브
    xhr.setRequestHeader('method', 'getDownloadSignature'); // 서브

    xhr.responseType = 'arraybuffer'; // 파일 다운로드 type

    xhr.onreadystatechange = () => {
        /**
         * readyState
         *  0: UNINITIALIZED - 객체만 생성되고 아직 초기화되지 않은 상태(open메서드 호출되지않음)
         *  1: LOADING - open 메서드가 호출되고 아직 send 메서드가 불리지 않은 상태
         *  2: LOADED - send메서드가 불렸지만 status와 헤더는 도착하지 않은 상태
         *  3: INTERACTIVE - 데이터의 일부를 받은 상태
         *  4: COMPLETED - 데이터를 전부 받은 상태, 완전한 데이터의 이용 가능
         */
        if (xhr.readyState === 4 && xhr.status === 200) {
            const blob = downloadUtil.createBlobForFile(xhr);

            // IE
            if (browserType === 'IE') {
                window.navigator.msSaveOrOpenBlob(blob, convertFileName);
            } else {
                const fileUrl = window.URL.createObjectURL(blob);

                downloadUtil.createAnchorAndDownload(fileUrl, convertFileName);
                window.URL.revokeObjectURL(fileUrl);
            }
        }
    };

    xhr.onerror = () => callbacks?.failLoadCallback && callbacks.failLoadCallback();
    xhr.onload = () => callbacks?.afterLoadCallback && callbacks.afterLoadCallback();
    xhr.send();
};

/**
 * Suspense 적용 시, api 호출 상태에 대해 idle이 적용된 Promise 반환
 * @param promise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrapPromise = (promise: Promise<any>) => {
    let status = 'pending';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    const suspender = promise.then(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any) => {
            status = 'success';
            result = res;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any) => {
            status = 'error';
            result = err;
        }
    );

    return {
        read() {
            if (status === 'pending') {
                throw suspender;
            } else if (status === 'error') {
                throw result;
            } else if (status === 'success') {
                return result;
            }
        },
    };
};

export { createRequestHeader, createUncertSignature, downloadFileFromS3, wrapPromise };

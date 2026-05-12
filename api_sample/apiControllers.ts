/**
 * 위 controller와 apiHandler에서 제공하는 handler를 사용하여 서비스마다 interceptor 정의하여 사용
 * 아래 예시에 따라 interceptor를 정의
 */
import axios, { CreateAxiosDefaults } from 'axios';

import { apiUrl, unCertUrl, objectStorageUrl, dwUrl } from './config';
import { TController } from './types';

// GW - 내부 서비스 접근
const serviceAPIController = (options: CreateAxiosDefaults) =>
    axios.create({
        ...options,
        baseURL: options.baseURL ?? apiUrl,
    });

// objectStorage 접근
const objectStorageAPIController = (options: CreateAxiosDefaults) =>
    axios.create({
        ...options,
        baseURL: options.baseURL ?? objectStorageUrl,
        timeout: 15000,
    });

// 비인증 통신
const unCertAPIController = (options: CreateAxiosDefaults) =>
    axios.create({
        ...options,
        baseURL: options.baseURL ?? unCertUrl,
    });

// DW Api 통신
const dwAPIController = (options: CreateAxiosDefaults) =>
    axios.create({
        ...options,
        baseURL: options.baseURL ?? dwUrl,
    });

/**
 * axios controller 생성 함수
 * @param type 생성할 controller type
 * @param options axios default options
 */
const createController = (type: TController, options?: CreateAxiosDefaults) => {
    const _options = options ?? {};

    switch (type) {
        case 'basic':
            return axios.create(_options);

        case 'gw':
            return serviceAPIController(_options);

        case 'objectStorage':
            return objectStorageAPIController(_options);

        case 'uncert':
            return unCertAPIController(_options);

        case 'dw':
            return dwAPIController(_options);

        default:
            throw new Error('Invalid Controller Type');
    }
};

/**
 * -------------- interceptor 정의 예시 --------------
 * 
 * GW 인증 통신 인터셉터
        serviceAPIController.interceptors.request.use(
            (request) => baseRequestHandler(request),
            (error) => requestErrorHandler(error)
        );

        serviceAPIController.interceptors.response.use(
            (response) => responseHandler(response),
            (error) => responseErrorHandler(error)
        );

 *  S3 스토리지 통신 인터셉터
        objectStorageAPIController.interceptors.request.use(
            (request) => objectStorageRequestHandler(request),
            (error) => requestErrorHandler(error)
        );

        objectStorageAPIController.interceptors.response.use(
            (response) => responseHandler(response),
            (error) => responseErrorHandler(error)
        );

 * 비인증 통신 인터셉터
        unCertAPIController.interceptors.request.use(
            (request) => uncertRequestHandler(request),
            (error) => requestErrorHandler(error)
        );

        unCertAPIController.interceptors.response.use(
            (response) => responseHandler(response),
            (error) => responseErrorHandler(error)
        );

 * DW 통신 인터셉터
        dwAPIController.interceptors.request.use(
            (request) => dwRequestHandler(request),
            (error) => requestErrorHandler(error)
        );

        dwAPIController.interceptors.response.use(
            (response) => responseHandler(response),
            (error) => responseErrorHandler(error)
        );
 * 
 * ----------------------------------------------------------------------
 */

export { createController };

import axios from 'axios';
import type { CreateAxiosDefaults } from 'axios';

import { apiUrl } from '../config';
import type { TController } from '../types';

const defaultAPIController = (options: CreateAxiosDefaults) =>
    axios.create({
        ...options,
        baseURL: options.baseURL ?? apiUrl,
    });

/**
 * axios controller 생성 함수
 */
const createController = (type: TController, options?: CreateAxiosDefaults) => {
    const _options = options ?? {};

    switch (type) {
        case 'basic':
            return axios.create(_options);

        case 'default':
            return defaultAPIController(_options);

        default:
            throw new Error('Invalid Controller Type');
    }
};

/**
 * -------------- interceptor 정의 예시 --------------
 *
 * defaultController.interceptors.request.use(
 *     (request) => baseRequestHandler(request),
 *     (error) => requestErrorHandler(error),
 * );
 * defaultController.interceptors.response.use(
 *     (response) => responseHandler(response),
 *     (error) => responseErrorHandler(error),
 * );
 * ----------------------------------------------------
 */

export { createController };

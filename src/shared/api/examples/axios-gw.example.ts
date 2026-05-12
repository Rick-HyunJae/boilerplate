import { createController } from '../axios/apiControllers';
import {
    baseRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const gwExampleController = createController('gw');

gwExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);
gwExampleController.interceptors.response.use(responseHandler, responseErrorHandler);

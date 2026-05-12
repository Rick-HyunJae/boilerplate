import { createController } from '../axios/apiControllers';
import {
    uncertRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const uncertExampleController = createController('uncert');

uncertExampleController.interceptors.request.use(uncertRequestHandler, requestErrorHandler);
uncertExampleController.interceptors.response.use(responseHandler, responseErrorHandler);

import { createController } from '../axios/apiControllers';
import {
    dwRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const dwExampleController = createController('dw');

dwExampleController.interceptors.request.use(dwRequestHandler, requestErrorHandler);
dwExampleController.interceptors.response.use(responseHandler, responseErrorHandler);

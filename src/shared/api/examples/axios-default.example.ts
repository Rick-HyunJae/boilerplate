import { createController } from '../axios/apiControllers';
import {
    baseRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const defaultExampleController = createController('default');

defaultExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);
defaultExampleController.interceptors.response.use(responseHandler, responseErrorHandler);

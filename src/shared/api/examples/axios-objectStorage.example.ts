import { createController } from '../axios/apiControllers';
import {
    objectStorageRequestHandler,
    responseHandler,
    requestErrorHandler,
    responseErrorHandler,
} from '../axios/apiHandlers';

export const objectStorageExampleController = createController('objectStorage');

objectStorageExampleController.interceptors.request.use(objectStorageRequestHandler, requestErrorHandler);
objectStorageExampleController.interceptors.response.use(responseHandler, responseErrorHandler);

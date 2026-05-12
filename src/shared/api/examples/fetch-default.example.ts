import { createController } from '../fetch/apiControllers';
import { baseRequestHandler, requestErrorHandler } from '../fetch/apiHandlers';

export const fetchDefaultExampleController = createController('default');

fetchDefaultExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);

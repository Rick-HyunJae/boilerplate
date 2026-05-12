import { createController } from '../fetch/apiControllers';
import { baseRequestHandler, requestErrorHandler } from '../fetch/apiHandlers';

export const fetchGwExampleController = createController('gw');

fetchGwExampleController.interceptors.request.use(baseRequestHandler, requestErrorHandler);

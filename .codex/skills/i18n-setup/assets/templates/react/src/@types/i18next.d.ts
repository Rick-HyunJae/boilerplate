import 'i18next';
import { resources } from '~language/i18n';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: (typeof resources)['ko'];
    }
}

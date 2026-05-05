import { createI18n } from 'vue-i18n';

import koCommon from './ko/common';
import enCommon from './en/common';
import jaCommon from './ja/common';

export const messages = {
	ko: { common: koCommon },
	en: { common: enCommon },
	ja: { common: jaCommon }
};

const i18n = createI18n({
	legacy: false,
	locale: 'ko',
	fallbackLocale: ['ko', 'en'],
	messages
});

export default i18n;

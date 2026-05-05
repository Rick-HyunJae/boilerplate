import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from './ko/common';

import enCommon from './en/common';

import jaCommon from './ja/common';

export const resources = {
	ko: {
		common: koCommon
	},
	en: {
		common: enCommon
	},
	ja: {
		common: jaCommon
	}
};

i18n.use(initReactI18next).init({
	resources,
	lng: 'ko',
	fallbackLng: ['ko', 'en'],
	supportedLngs: ['ko', 'en', 'ja'],
	ns: ['common'],
	defaultNS: 'common',
	fallbackNS: 'common',
	debug: false
});

export default i18n;

import 'vue-i18n';
import { messages } from '../i18n';

declare module 'vue-i18n' {
	export interface DefineLocaleMessage extends (typeof messages)['ko'] {}
}

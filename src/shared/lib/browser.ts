import { v4 as uuid } from 'uuid';

declare global {
	interface Document {
		documentMode: any; // browser detect 모드
	}
}

/** 새로운 browser(window) 팝업 생성 */
const openWindowPopup = (url: string, name?: string, width?: number, height?: number): void => {
	const _name = name ?? uuid();
	const _width = width ?? 740;
	const _height = height ?? 630;

	window.open(url, '_blank', `name=${_name},scrollbars=1,menubar=0,resizable=1,width=${_width},height=${_height}`);
};

/**
 * @description 접근 브라우저 확인
 */
const detectBrowser = (): 'Opera' | 'Chrome' | 'Safari' | 'Firefox' | 'IE' | 'Unknown' => {
	if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) != -1) return 'Opera';
	if (navigator.userAgent.indexOf('Chrome') != -1) return 'Chrome';
	if (navigator.userAgent.indexOf('Safari') != -1) return 'Safari';
	if (navigator.userAgent.indexOf('Firefox') != -1) return 'Firefox';
	if (navigator.userAgent.indexOf('MSIE') != -1 || !!document.documentMode == true) return 'IE'; //crap

	return 'Unknown';
};

/**
 * @description 접근 디바이스 확인
 */
const detectDevice = (): 'Computer' | 'Phone' => {
	if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i)) return 'Phone';

	return 'Computer';
};

export default { openWindowPopup, detectBrowser, detectDevice };

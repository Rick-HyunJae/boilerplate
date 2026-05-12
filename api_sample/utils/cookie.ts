/**
 * 새로운 쿠키를 세팅하는 함수
 * @param name 생성할 쿠키 key
 * @param value 생성할 쿠키 값
 * @param day 만료 일자
 * @param domain 적용할 도메인
 */
const setCookie = (name: string, value: any, day: number, domain: string) => {
	const date = new Date();
	date.setTime(date.getTime() + day * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${date.toUTCString()};domain=${domain};path=/`;
};

/**
 * 저장된 쿠키를 불러오는 함수
 * @param name 저장된 쿠키 key
 */
const getCookie = (name: string) => {
	const value = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`);
	return value ? value[2] : undefined;
};

/**
 * 저장된 쿠키를 삭제하는 함수 - 만료일자를 변경하여 동작을 멈춤
 * @param name 저장된 쿠키 key
 * @param domain 적용할 도메인
 */
const removeCookie = (name: string, domain: string) => {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${domain};`;
};

/**
 * 써드파티 내 input hidden에 저장되어 있는 value를 검색 (쿠키에 존재하지 않는 값 사용 시)
 * @param id  input hidden으로 숨겨져있는 document id
 */
const getHeaderValue = (id: string): number | string | undefined => (document.getElementById(id) as HTMLInputElement)?.value;

/**
 * 써드파티 내 input hidden에 저장되어 있는 쿠키를 우선 검색 (속도 향상), 없는 경우 브라우저 쿠키 저장소를 검색
 * @param name  저장된 쿠키 key
 */
const getLatestCookie = (name: string): number | string | undefined => getHeaderValue(name) || getCookie(name);

export default {
	setCookie,
	getCookie,
	removeCookie,
	getLatestCookie,
	getHeaderValue
};

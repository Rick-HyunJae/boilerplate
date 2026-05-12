let testCookies = 'testCookie=10';

const setCookieMock = jest.fn((name: string, value: any, day: number, domain: string) => {
	const date = new Date();
	date.setTime(date.getTime() + day * 24 * 60 * 60 * 1000);

	testCookies = `${testCookies}; ${name}=${value};expires=${date.toUTCString()};domain=${domain};path=/`;
});

const getCookieMock = jest.fn((name: string) => {
	const value = testCookies.match(`(^|;) ?${name}=([^;]*)(;|$)`);
	return value ? value[2] : null;
});

const removeCookieMock = jest.fn((name: string, domain: string) => {
	testCookies = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${domain};`;
});

describe('Cookie Setting Test', () => {
	const domain = 'http://test.wehago.com:3000';
	const name = 'newCookie';
	const value = 1000;
	const day = 1;

	it('getCookie Test', () => {
		expect(getCookieMock('testCookie')).toBe('10');
	});

	it('setCookie Test', () => {
		setCookieMock(name, value, day, domain);
		expect(getCookieMock(name)).toBe(value.toString());
	});

	it('removeCookie Test', () => {
		removeCookieMock(name, domain);
		expect(getCookieMock(name)).toBeUndefined;
	});
});

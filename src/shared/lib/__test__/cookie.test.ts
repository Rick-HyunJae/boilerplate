import { describe, it, expect, beforeEach } from 'vitest';
import cookieUtil from '../cookie';

describe('cookie util', () => {
    beforeEach(() => {
        document.cookie.split(';').forEach((c) => {
            const name = c.split('=')[0]?.trim();
            if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
        });
    });

    it('setCookie + getCookie — 저장한 값이 동일하게 읽혀야 한다', () => {
        cookieUtil.setCookie('foo', 'bar', 1, 'localhost');
        expect(cookieUtil.getCookie('foo')).toBe('bar');
    });

    it('getCookie — 존재하지 않는 키는 undefined를 반환한다', () => {
        expect(cookieUtil.getCookie('missing')).toBeUndefined();
    });

    it('removeCookie — 삭제 후 getCookie 결과가 undefined이다', () => {
        cookieUtil.setCookie('foo', 'bar', 1, 'localhost');
        cookieUtil.removeCookie('foo', 'localhost');
        expect(cookieUtil.getCookie('foo')).toBeUndefined();
    });

    it('getLatestCookie — input hidden이 우선, 없으면 쿠키로 fallback', () => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'priority_key';
        input.value = 'from-hidden';
        document.body.appendChild(input);

        cookieUtil.setCookie('priority_key', 'from-cookie', 1, 'localhost');
        expect(cookieUtil.getLatestCookie('priority_key')).toBe('from-hidden');

        document.body.removeChild(input);
        expect(cookieUtil.getLatestCookie('priority_key')).toBe('from-cookie');
    });
});

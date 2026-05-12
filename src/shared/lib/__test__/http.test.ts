import { describe, it, expect } from 'vitest';
import apiUtil from '../http';

const { getLocation, getTransactionId } = apiUtil;

describe('getTransactionId Test', () => {
	it('- 기호 삭제 필수', () => {
		expect(getTransactionId()).not.toMatch(/-/i);
	});

	it('빈 문자열이 반환 X', () => {
		expect(getTransactionId()).not.toBe('');
	});
});

describe('getLocation Test', () => {
	it('추가 정보가 없는 도메인 테스트', () => {
		expect(getLocation('https://test.wehago.com:3000')).toStrictEqual({
			hash: '',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '',
			port: '3000',
			protocol: 'https:',
			search: ''
		});
	});

	it('Hash가 포함된 도메인 테스트', () => {
		expect(getLocation('https://test.wehago.com:3000/#/dashboards/1')).toStrictEqual({
			hash: '#/dashboards/1',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '/',
			port: '3000',
			protocol: 'https:',
			search: ''
		});
	});

	it('추가 param이 존재하는 도메인 테스트', () => {
		expect(getLocation('https://test.wehago.com:3000/dashboards')).toStrictEqual({
			hash: '',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '/dashboards',
			port: '3000',
			protocol: 'https:',
			search: ''
		});

		expect(getLocation('https://test.wehago.com:3000/dashboards/1')).toStrictEqual({
			hash: '',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '/dashboards/1',
			port: '3000',
			protocol: 'https:',
			search: ''
		});
	});

	it('search가 존재하는 도메인 테스트', () => {
		expect(getLocation('https://test.wehago.com:3000/dashboards/1?id=1&password=123')).toStrictEqual({
			hash: '',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '/dashboards/1',
			port: '3000',
			protocol: 'https:',
			search: '?id=1&password=123'
		});

		expect(getLocation('https://test.wehago.com:3000/#/dashboards/1?id=1&password=123')).toStrictEqual({
			hash: '#/dashboards/1?id=1&password=123',
			host: 'test.wehago.com:3000',
			hostname: 'test.wehago.com',
			pathname: '/',
			port: '3000',
			protocol: 'https:',
			search: ''
		});
	});
});

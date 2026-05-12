import { describe, it, expect } from 'vitest';
import encryptUtil from '../encrypt';

const { aesEncrypt, aesDecrypt } = encryptUtil;
const testEncryptKey = 'test';

describe('encryptUtil Test', () => {
	let result: any = null;

	it('암호화 성공 테스트', () => {
		result = aesEncrypt('암호화 테스트 문자열', testEncryptKey);

		expect(result?.salt).not.toBeFalsy();
		expect(result?.value).not.toBeFalsy();
	});

	it('암호화 실패 테스트', () => {
		expect(aesEncrypt('', testEncryptKey)).toBeUndefined(); // 빈 문자열 테스트

		//@ts-ignore - 문자열 이외 테스트
		expect(aesEncrypt(1)).toBeUndefined();
	});

	it('복호화 성공 테스트', () => {
		const decrypt = aesDecrypt(result.value, testEncryptKey);
		expect(decrypt).toBe('암호화 테스트 문자열');
	});

	it('복호화 실패 테스트 - 암호화된 정보가 다른 경우 빈 문자열 반환', () => {
		const decrypt = aesDecrypt('암호화된 정보와 다른 문자열', testEncryptKey);
		expect(decrypt).toBe('');
	});
});

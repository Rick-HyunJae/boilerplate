import CryptoJS from 'crypto-js';

/**
 * 문자열 AES 암호화
 * @param value 암호화할 문자열
 * @param encryptKey 암호화할 key
 */
const aesEncrypt = (value: string, encryptKey: string): { salt: string; value: string } | undefined => {
	if (encryptKey === undefined) return undefined;
	if (typeof value !== 'string' || value === '') return undefined;

	const encrypt = CryptoJS.AES.encrypt(value, encryptKey, {});
	const key = encrypt.salt.toString(); // unique key
	const encryptValue = encrypt.toString(); // encrypted value

	return {
		salt: encodeURIComponent(key),
		value: encodeURIComponent(encryptValue)
	};
};

/**
 * AES 문자열 복호화
 * @param encryptedValue 복호화할 암호화 문자열
 * @param encryptKey 암호화에 사용한 key
 */
const aesDecrypt = (encryptedValue: string, encryptKey: string): string | undefined => {
	if (encryptKey === undefined) return undefined;
	if (typeof encryptedValue !== 'string' || encryptedValue === '') return undefined;

	try {
		const decodeValue = decodeURIComponent(encryptedValue);
		const decrypt = CryptoJS.AES.decrypt(decodeValue, encryptKey, {}).toString(CryptoJS.enc.Utf8);
		return decrypt;
	} catch (_) {
		return undefined;
	}
};

const sha256Encrypt = (value: string, saltSize: number): string | undefined => {
	if (typeof value !== 'string' || value === '') return undefined;
	if (saltSize <= 0) return undefined;

	const salt = CryptoJS.lib.WordArray.random(saltSize);
	const messageWordArray = CryptoJS.enc.Utf8.parse(value);
	const saltedMessage = salt.concat(messageWordArray);
	const hash = CryptoJS.SHA256(saltedMessage);

	return CryptoJS.enc.Hex.stringify(hash);
};

export default { aesEncrypt, aesDecrypt, sha256Encrypt };

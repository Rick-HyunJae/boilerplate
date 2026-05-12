import convertValueUtil from '../convert';

const { convertPriceToComma, convertCommaToPrice, convertEncodingTextToText } = convertValueUtil;

describe('숫자 > , 적용 문자열 테스트', () => {
	it('3자리 미만 숫자는 , X', () => {
		expect(convertPriceToComma(100)).toBe('100');
	});

	it('3자리 이상 정수 테스트', () => {
		expect(convertPriceToComma(1234567)).toBe('1,234,567');
	});

	it('3자리 이상 음수 테스트', () => {
		expect(convertPriceToComma(-1234567)).toBe('-1,234,567');
	});

	it('3자리 이상 float 테스트', () => {
		expect(convertPriceToComma(1234567.2222)).toBe('1,234,567.2222');
		expect(convertPriceToComma(-1234567.2222)).toBe('-1,234,567.2222');
	});
});

describe(', 적용 문자열 > 숫자', () => {
	it('3자리 이상 정수 테스트', () => {
		expect(convertCommaToPrice('1,234,567')).toBe(1234567);
		expect(convertCommaToPrice('-1,234,567')).toBe(-1234567);
	});

	it('3자리 이상 소수 테스트', () => {
		expect(convertCommaToPrice('1,234,567.789')).toBe(1234567.789);
		expect(convertCommaToPrice('-1,234,567.789')).toBe(-1234567.789);
	});

	it('빈 문자열 시, 0 반환', () => {
		expect(convertCommaToPrice('')).toBe(0);
	});

	it('잘못된 문자열일 때, 0 반환', () => {
		expect(convertCommaToPrice('ㅂㅈㄷ갸ewtq*(@&$^')).toBe(0);
		expect(convertCommaToPrice('.')).toBe(0);
		expect(convertCommaToPrice('-')).toBe(0);
		expect(convertCommaToPrice("123`~₩!@#$%^&*()_|+=?;:'<>123")).toBe(0);
		expect(convertCommaToPrice('123ㄱㄷㅂsdth123')).toBe(0);
	});
});

describe('Encoding 특수문자 치환', () => {
	it('&lt, &gt 테스트', () => {
		expect(convertEncodingTextToText('&lt;꺽쇠가 표현된 문자열&gt;')).toBe('<꺽쇠가 표현된 문자열>');
	});

	it('&nbsp 테스트', () => {
		expect(convertEncodingTextToText('공백이&nbsp;적용되었는지 테스트')).toBe('공백이 적용되었는지 테스트');
	});

	it('&quot 테스트', () => {
		expect(convertEncodingTextToText('&quot;쌍따옴표 적용 테스트&quot;')).toBe('"쌍따옴표 적용 테스트"');
	});

	it('&amp 테스트', () => {
		expect(convertEncodingTextToText('&amp;&적용되었는지 테스트&amp;')).toBe('&&적용되었는지 테스트&');
	});

	it('이외의 다른 특수문자는 제거되는지 테스트', () => {
		expect(convertEncodingTextToText('&aaa;&ttt;이 앞은 개수만큼 공백으로 함')).toBe('  이 앞은 개수만큼 공백으로 함');
	});
});

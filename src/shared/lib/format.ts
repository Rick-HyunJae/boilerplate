import { addCommaReg, specialTextForNumberReg, koreanReg, englishReg, invalidStringNumericReg } from '@/shared/lib/constants/regex';

/**
 * @description number로 표현된 수치에 대해 1000의 자리마다 ,를 추가하여 반환
 * @param value
 */
const convertPriceToCommaUsingReg = (value: number): string => {
	const isNegative = value < 0;
	const filter = isNegative ? value.toString().slice(1) : value.toString();

	const splitFilter = filter.split('.');
	const integer = splitFilter[0];
	const decimalValue = splitFilter[1];

	const addComma = integer.replace(addCommaReg, ',');
	const returnVal = decimalValue ? `${addComma}.${decimalValue}` : `${addComma}`;

	return isNegative ? `-${returnVal}` : returnVal;
};

/**
 * number로 표현된 수치에 대해 1000의 자리마다 ,를 추가하여 반환 (소수점 이하 6자리까지 반환)
 * @param value
 */
const numericFormatter = new Intl.NumberFormat('ko', { maximumFractionDigits: 6 }); // NODE 16 이상
const convertPriceToComma = (value: number): string => {
	if (numericFormatter) return numericFormatter.format(value);

	return convertPriceToCommaUsingReg(value);
};

/**
 * @description 1000의 자리마다 ,로 표현된 문자열을 number로 변환하여 반환
 * @description 숫자를 제외한 모든 문자는 제거
 * @param value
 */
const convertCommaToPrice = (value: string): number => {
	if (value.length === 0) return 0;
	// Strip commas first (they are the purpose of this function) before validation
	const withoutCommas = value.replace(/,/g, '');
	if (koreanReg.test(withoutCommas) || englishReg.test(withoutCommas) || invalidStringNumericReg.test(withoutCommas)) return 0;

	const filteredValue = withoutCommas.replace(koreanReg, '').replace(englishReg, '').replace(specialTextForNumberReg, '');

	if (filteredValue.length === 1 && (filteredValue.indexOf('-') || filteredValue.indexOf('.'))) return 0;
	if (filteredValue.indexOf('-') !== filteredValue.lastIndexOf('-')) return 0;
	if (filteredValue.indexOf('.') !== filteredValue.lastIndexOf('.')) return 0;

	return Number(filteredValue);
};

/**
 * Encoding 된 특수문자를 원래 문자로 변환하여 반환 (상황에 따라 예외 케이스를 지속적으로 추가할 필요가 있음)
 * @param value
 */
const convertEncodingTextToText = (value: string | null): string => {
	return value
		? value
				.replace(/&lt;/g, '<') // <
				.replace(/&gt;/g, '>') // >
				.replace(/&nbsp;/g, ' ') // '' (공백)
				.replace(/&quot;/g, '"') // " (큰 따옴표 하나)
				.replace(/&amp;/g, '&') // &
				.replace(/&[a-zA-Z]+;/g, ' ') // 그 외
		: '-';
};

export default { convertPriceToComma, convertCommaToPrice, convertEncodingTextToText };

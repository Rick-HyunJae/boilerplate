/**
 * 부동소수점 이슈를 피해 소수점 자리수에 대한 반올림 수행
 * @param value
 * @param point 반올림할 소수점 자리 수
 */
const mathRoundDecimalValue = (value: number, point: number): number => {
	const EPSILON = 0.000000001;
	const pointSquare = 10 ** point;

	return Math.round((value + EPSILON) * pointSquare) / pointSquare;
};

/**
 * 숫자가 소수라면 소수점 이하 몇 자리인지 decimal 길이를 반환
 * @param value
 */
const calcDecimalLength = (value: number): number => {
	const filteredValue = value.toString().split('.')[1];

	return filteredValue ? filteredValue.length : 0;
};

/**
 * float 타입의 number를 덧셈, 뺄셈 연산할 경우, 부동소수점 문제를 해결하는 연산함수
 * @param type 연산방식
 * @param arg1 연산하고자 하는 상수
 * @param agr2 연산하고자 하는 상수
 */
const floatOperation = (type: 'add' | 'sub' | 'multiply' | 'divide', arg1: number, arg2: number): number => {
	const decimal1 = calcDecimalLength(arg1);
	const decimal2 = calcDecimalLength(arg2);
	const decimalSize = decimal1 >= decimal2 ? decimal1 : decimal2;
	const roundingPoint = type === 'add' || type === 'sub' ? 10 ** decimalSize : 100 ** decimalSize;

	let operationResult = 0;
	switch (type) {
		case 'add':
			operationResult = arg1 + arg2;
			break;

		case 'sub':
			operationResult = arg1 - arg2;
			break;

		case 'multiply':
			operationResult = arg1 * arg2;
			break;

		case 'divide':
			operationResult = arg1 / arg2;
			break;

		default:
			throw new Error('Invalid Type in Float Operation');
	}

	return Math.round(operationResult * roundingPoint) / roundingPoint;
};

export default { mathRoundDecimalValue, calcDecimalLength, floatOperation };

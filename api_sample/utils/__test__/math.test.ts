import mathUtil from '../math';

const { mathRoundDecimalValue, calcDecimalLength, floatOperation } = mathUtil;

describe('mathUtil Test', () => {
	const floatingPointExample = 0.1 + 0.2;

	it('mathRoundDecimalValue Test', () => {
		const result1 = mathRoundDecimalValue(floatingPointExample, 2);
		const result2 = mathRoundDecimalValue(floatingPointExample, 0);

		expect(result1).toBe(0.3);
		expect(result2).toBe(0);
	});

	it('calcDecimalLength Test', () => {
		const result1 = calcDecimalLength(1);
		const result2 = calcDecimalLength(1.145);
		const result3 = calcDecimalLength(-1.145);

		expect(result1).toBe(0);
		expect(result2).toBe(3);
		expect(result3).toBe(3);
	});

	it('floatOperation add Test', () => {
		const result1 = floatOperation('add', 0.1, 0.2);
		const result2 = floatOperation('add', 1, 0.2);
		const result3 = floatOperation('add', 1.2, 0.2);

		expect(result1).toBe(0.3);
		expect(result2).toBe(1.2);
		expect(result3).toBe(1.4);
	});

	it('floatOperation sub Test', () => {
		const result1 = floatOperation('sub', 0.1, 0.2);
		const result2 = floatOperation('sub', 1, 0.2);
		const result3 = floatOperation('sub', 1.2, 0.2);

		expect(result1).toBe(-0.1);
		expect(result2).toBe(0.8);
		expect(result3).toBe(1);
	});

	it('floatOperation multiply Test', () => {
		const result1 = floatOperation('multiply', 0.1, 0.2);
		const result2 = floatOperation('multiply', 1, 0.2);
		const result3 = floatOperation('multiply', 1.2, 0.2);

		expect(result1).toBe(0.02);
		expect(result2).toBe(0.2);
		expect(result3).toBe(0.24);
	});

	it('floatOperation divide Test', () => {
		const result1 = floatOperation('divide', 0.1, 0.2);
		const result2 = floatOperation('divide', 1, 0.2);
		const result3 = floatOperation('divide', 1.2, 0.2);

		expect(result1).toBe(0.5);
		expect(result2).toBe(5);
		expect(result3).toBe(6);
	});
});

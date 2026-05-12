type TConsole = 'log' | 'warn' | 'info' | 'error';

/**
 * 서비스 내 선언된 console 메소드를 무효화
 * @param typeList
 */
const removeConsoles = (typeList: TConsole[]) => {
	typeList.forEach((logType: TConsole) => {
		console[logType] = function () {};
	});
};

export default { removeConsoles };

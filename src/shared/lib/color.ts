// prettier-ignore
const OPACITY_SUFFIX = ['00', '03', '05', '08', '0A', '0D', '0F', '12', '14', '17', '1A', '1C', '1F', '21', '24', '26', '29', '2B', '2E', '30', '33', '36', '38', '3B', '3D', '40', '42', '45', '47', '4A', '4D', '4F', '52', '54', '57', '59', '5C', '5E', '61', '63', '66', '69', '6B', '6E', '70', '73', '75', '78', '7A', '7D', '80', '82', '85', '87', '8A', '8C', '8F', '91', '94', '96', '99', '9C', '9E', 'A1', 'A3', 'A6', 'A8', 'AB', 'AD', 'B0', 'B3', 'B5', 'B8', 'BA', 'BD', 'BF', 'C2', 'C4', 'C7', 'C9', 'CC', 'CF', 'D1', 'D4', 'D6', 'D9', 'DB', 'DE', 'E0', 'E3', 'E6', 'E8', 'EB', 'ED', 'F0', 'F2', 'F5', 'F7', 'FA', 'FC', 'FF'];

/**
 * Hex color 값에 opacity 값을 추가한 색상값을 반환
 * @param {color} hex 코드 #포함 7자리 문자열
 * @param {opacity} 0 ~ 100 정수, % 단위
 */
const onChangeOpacity = (color: string, opacity: number): string => {
	if (color.indexOf('#') !== 0) throw new Error('Invalid Color Type :: Color must declare using Hex');
	if (color.length !== 7) throw new Error('Invalid Color length :: Color must declare by 7 length string');

	const _opacity = opacity < 0 ? 0 : opacity > 100 ? 100 : opacity;

	return `${color}${OPACITY_SUFFIX[_opacity]}`;
};

export default { OPACITY_SUFFIX, onChangeOpacity };

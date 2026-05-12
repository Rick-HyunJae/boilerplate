import { v4 as uuid } from 'uuid';

import { locationReg } from '@/shared/lib/constants/regex';

/** - 제외된 uuid 생성 */
const getTransactionId = () => uuid().replace(/-/g, '');

type TLocation = {
	protocol: string;
	host: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
};
/** url 분해, 각 데이터 추출 */
const getLocation = (url: string): TLocation | null => {
	const result = url.match(locationReg);

	// 접근 도메인 정보 배열 생성
	return (
		result && {
			protocol: result[1],
			host: result[2],
			hostname: result[3],
			port: result[4],
			pathname: result[5],
			search: result[6],
			hash: result[7]
		}
	);
};

/** timestamp 생성 */
const getTimestamp = (): string => Math.floor(Date.now() / 1000).toString();

export default { getTransactionId, getLocation, getTimestamp };

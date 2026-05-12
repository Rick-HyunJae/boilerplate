/**
 * 두 날짜 사이의 D-Day 계산
 * @param startDate
 * @param endDate
 */
const calcBetweenDate = (startDate: Date, endDate: Date): number => {
	const startDateTime = startDate.getTime();
	const endDateTime = endDate.getTime();

	if (endDateTime < startDateTime) return 0;
	return Math.round((endDateTime - startDateTime) / (1000 * 3600 * 24));
};

export default { calcBetweenDate };

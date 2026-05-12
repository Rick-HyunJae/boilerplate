import apiUtil from '@/shared/lib/http';

const createRequestHeader = (): { timestamp: string; transactionId: string } => {
    const timestamp = apiUtil.getTimestamp();
    const transactionId = apiUtil.getTransactionId();
    return Object.freeze({ timestamp, transactionId });
};

export { createRequestHeader };

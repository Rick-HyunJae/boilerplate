// javascript-obfuscator:disable
const isLive = process.env.BUILD_TYPE === 'live';

function generateGWUrl() {
    switch (process.env.SERVICE_TYPE) {
        case 'wehagom':
            return 'https://api.wehagom.com';

        case 'wehagov':
            return 'https://api.wehagov.com';

        case 'aws':
            return 'https://api.insightofus.ai';

        default:
            return 'https://api.wehago.com';
    }
}

function generateUnCertUrl() {
    switch (process.env.SERVICE_TYPE) {
        case 'wehagom':
            return 'https://api0.wehagom.com';

        case 'wehagov':
            return 'https://api0.wehagov.com';

        case 'aws':
            return 'https://api0.insightofus.ai';

        default:
            return 'https://api0.wehago.com';
    }
}

const apiUrl = isLive ? generateGWUrl() : 'http://dev.api.wehago.com';
const unCertUrl = isLive ? generateUnCertUrl() : 'http://dev.api0.wehago.com';
const objectStorageUrl = apiUrl + '/ObjectStorageCommon/services/common';
const dwUrl = 'https://dwapi.wehago.com';

export { apiUrl, unCertUrl, objectStorageUrl, dwUrl };

// javascript-obfuscator:disable
import { ENV } from '@/shared/config/env';

const isLive = ENV.BUILD_TYPE === 'live';

function generateApiUrl() {
    switch (ENV.SERVICE_TYPE) {
        case 'alt':
            return 'https://api.alt.example.com';
        default:
            return 'https://api.example.com';
    }
}

const apiUrl = isLive ? generateApiUrl() : 'https://dev.api.example.com';

export { apiUrl };

export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    APP_MODE: import.meta.env.VITE_APP_MODE as 'dev' | 'prod',
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;

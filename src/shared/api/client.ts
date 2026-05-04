import axios from 'axios';

/**
 * @description 앱 전역 axios 인스턴스
 * request interceptor: localStorage의 token을 Authorization Bearer 헤더로 자동 주입한다
 * response interceptor: error.response?.data?.message를 new Error()로 래핑해
 * 상위 레이어가 항상 error.message로 접근할 수 있도록 에러 인터페이스를 통일한다
 */
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message ?? error.message;
        return Promise.reject(new Error(message));
    }
);

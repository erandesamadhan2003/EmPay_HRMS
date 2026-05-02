import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 120000,
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	},
});

/** Let multipart boundaries be set correctly by the runtime. */
api.interceptors.request.use((config) => {
	if (config.data instanceof FormData) {
		delete config.headers['Content-Type'];
	}
	return config;
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
            console.warn('Token expired or invalid. Forcing logout.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
        
        if (isNetworkError) {
            console.warn('Persistent Network Error:', {
                message: error.message,
                code: error.code,
                url: `${originalRequest?.baseURL}${originalRequest?.url}`,
            });
        }
        return Promise.reject(error);
    }
);

export default api;
import axios from 'axios';

import useAuthStore from '../store/auth.store.js';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
	timeout: 60000,
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	const accessToken = useAuthStore.getState().accessToken;

	if (accessToken) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${accessToken}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			useAuthStore.getState().clearAuth();
		}

		return Promise.reject(error);
	},
);

export default api;
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
	baseURL: '/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add JWT token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('adminToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid, remove it and redirect to login
			localStorage.removeItem('adminToken');
			window.location.href = '/admin';
		}
		return Promise.reject(error);
	}
);

export default api; 
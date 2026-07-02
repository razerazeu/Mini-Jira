import axios from 'axios';
import { API_BASE } from './apiBase';
import { clearAuthSession, getStoredToken } from './authStorage';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Add request interceptor to include authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      clearAuthSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

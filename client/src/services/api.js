import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// Get API URL from environment variable, fallback to default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Only redirect if not already on auth pages
      if (!currentPath.includes('/auth/')) {
        // Clear storage
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Use window.location for reliable redirect outside React Router context
        // This ensures the redirect happens even if called from API interceptor
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check if the backend server is running.';
      error.isNetworkError = true;
    }
    
    // Add user-friendly error message
    if (error.response?.data) {
      error.userMessage = error.response.data.message || 
                         error.response.data.error || 
                         error.response.data.msg ||
                         `Server error: ${error.response.status}`;
    }
    
    return Promise.reject(error);
  }
);

export default api;


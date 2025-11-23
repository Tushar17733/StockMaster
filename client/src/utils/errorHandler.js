// Centralized error handling utility
import { STORAGE_KEYS } from './constants';

/**
 * Extract error message from API error
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';
  
  // Network error
  if (!error.response) {
    return 'Network error. Please check if the backend server is running.';
  }
  
  // Server error with message
  const status = error.response.status;
  const data = error.response.data;
  
  // Handle different error formats
  const message = 
    data?.message || 
    data?.error || 
    data?.msg || 
    data?.error?.message ||
    `Server error: ${status} ${error.response.statusText}`;
  
  return message;
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error, logoutCallback) => {
  if (error.response?.status === 401) {
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    // Call logout callback if provided
    if (logoutCallback) {
      logoutCallback();
    }
    
    return true; // Indicates auth error was handled
  }
  
  return false;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return !error.response && (error.message?.includes('Network') || error.code === 'ECONNABORTED');
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error) => {
  if (isNetworkError(error)) {
    return 'Cannot connect to server. Please check your internet connection and ensure the backend server is running.';
  }
  
  return getErrorMessage(error);
};


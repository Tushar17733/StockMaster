import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

// Use mock API if VITE_USE_MOCK_API is true or if API URL is not set
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const authAPI = {
  login: async (credentials) => {
    if (USE_MOCK) {
      const result = await mockApi.auth.login(credentials);
      return result.data;
    }
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const responseData = extractData(response, USE_MOCK);
    return {
      user: toCamelCase(responseData.user || responseData),
      token: responseData.token,
    };
  },

  signup: async (userData) => {
    if (USE_MOCK) {
      const result = await mockApi.auth.signup(userData);
      return result.data;
    }
    const response = await api.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
    const responseData = extractData(response, USE_MOCK);
    return {
      user: toCamelCase(responseData.user || responseData),
      token: responseData.token,
    };
  },

  requestOTP: async (email) => {
    if (USE_MOCK) {
      const result = await mockApi.auth.requestOTP({ email });
      return result.data;
    }
    const response = await api.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
    return extractData(response, USE_MOCK);
  },

  resetPassword: async (data) => {
    // Convert camelCase to snake_case for backend
    const requestData = toSnakeCase({
      email: data.email,
      otpCode: data.otpCode || data.otp_code,
      newPassword: data.newPassword || data.new_password,
    });
    
    if (USE_MOCK) {
      const result = await mockApi.auth.resetPassword(data);
      return result.data;
    }
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, requestData);
    return extractData(response, USE_MOCK);
  },

  getMe: async () => {
    if (USE_MOCK) {
      const result = await mockApi.auth.verifyToken();
      return result.data;
    }
    // Backend uses /auth/me
    const response = await api.get(API_ENDPOINTS.AUTH.GET_ME);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.user || responseData);
  },
};


import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const profileAPI = {
  get: async () => {
    if (USE_MOCK) {
      const result = await mockApi.profile.get();
      return result.data;
    }
    // Backend uses /users/me for profile
    const response = await api.get(API_ENDPOINTS.PROFILE);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.user || responseData);
  },

  update: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.profile.update(data);
      return result.data;
    }
    // Backend may not have update endpoint, but keep for mock compatibility
    const requestData = toSnakeCase({
      name: data.name,
      phone: data.phone,
      defaultWarehouseId: data.defaultWarehouseId || data.default_warehouse_id,
    });
    const response = await api.put(API_ENDPOINTS.PROFILE, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.user || responseData);
  },
};


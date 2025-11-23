import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const categoriesAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.categories.getAll(params);
      return result.data;
    }
    const response = await api.get(API_ENDPOINTS.CATEGORIES);
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.categories || []).map(toCamelCase),
      total: responseData.categories?.length || responseData.total || 0,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.categories.getById(id);
      return result.data;
    }
    const response = await api.get(`${API_ENDPOINTS.CATEGORIES}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.category || responseData);
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.categories.create(data);
      return result.data;
    }
    const requestData = toSnakeCase({
      name: data.name,
      description: data.description,
    });
    const response = await api.post(API_ENDPOINTS.CATEGORIES, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.category || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.categories.update(id, data);
      return result.data;
    }
    // Backend uses PATCH
    const requestData = toSnakeCase({
      name: data.name,
      description: data.description,
    });
    const response = await api.patch(`${API_ENDPOINTS.CATEGORIES}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.category || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.categories.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
    return extractData(response, USE_MOCK);
  },
};


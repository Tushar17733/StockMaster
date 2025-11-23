import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const warehousesAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.warehouses.getAll(params);
      return result.data;
    }
    const response = await api.get(API_ENDPOINTS.WAREHOUSES);
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.warehouses || []).map(toCamelCase),
      total: responseData.warehouses?.length || responseData.total || 0,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.warehouses.getById(id);
      return result.data;
    }
    const response = await api.get(`${API_ENDPOINTS.WAREHOUSES}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.warehouse || responseData);
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.warehouses.create(data);
      return result.data;
    }
    const requestData = toSnakeCase({
      name: data.name,
      code: data.code,
      address: data.address,
    });
    const response = await api.post(API_ENDPOINTS.WAREHOUSES, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.warehouse || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.warehouses.update(id, data);
      return result.data;
    }
    // Backend uses PATCH
    const requestData = toSnakeCase({
      name: data.name,
      code: data.code,
      address: data.address,
    });
    const response = await api.patch(`${API_ENDPOINTS.WAREHOUSES}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.warehouse || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.warehouses.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.WAREHOUSES}/${id}`);
    return extractData(response, USE_MOCK);
  },
};


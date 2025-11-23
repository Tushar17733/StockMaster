import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const locationsAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.locations.getAll(params);
      return result.data;
    }
    
    const queryParams = {
      warehouse_id: params.warehouseId || params.warehouse_id,
      location_type: params.locationType || params.location_type,
    };
    
    const response = await api.get(API_ENDPOINTS.LOCATIONS, {
      params: Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== undefined))
    });
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.locations || []).map(toCamelCase),
      total: responseData.locations?.length || responseData.total || 0,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.locations.getById(id);
      return result.data;
    }
    const response = await api.get(`${API_ENDPOINTS.LOCATIONS}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.location || responseData);
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.locations.create(data);
      return result.data;
    }
    const requestData = toSnakeCase({
      warehouseId: data.warehouseId || data.warehouse_id,
      name: data.name,
      locationType: data.locationType || data.location_type || 'INTERNAL',
    });
    const response = await api.post(API_ENDPOINTS.LOCATIONS, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.location || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.locations.update(id, data);
      return result.data;
    }
    // Backend uses PATCH
    const requestData = toSnakeCase({
      name: data.name,
      locationType: data.locationType || data.location_type,
    });
    const response = await api.patch(`${API_ENDPOINTS.LOCATIONS}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.location || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.locations.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.LOCATIONS}/${id}`);
    return extractData(response, USE_MOCK);
  },
};


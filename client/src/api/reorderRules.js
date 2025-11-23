import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const reorderRulesAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.reorderRules.getAll(params);
      return result.data;
    }
    
    const queryParams = {
      product_id: params.productId || params.product_id,
    };
    
    const response = await api.get(API_ENDPOINTS.REORDER_RULES, {
      params: Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== undefined))
    });
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.reorder_rules || []).map(toCamelCase),
      total: responseData.reorder_rules?.length || responseData.total || 0,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.reorderRules.getById(id);
      return result.data;
    }
    // Backend may not have getById, but keep for mock compatibility
    const response = await api.get(`${API_ENDPOINTS.REORDER_RULES}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.reorder_rule || responseData);
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.reorderRules.create(data);
      return result.data;
    }
    const requestData = toSnakeCase({
      productId: data.productId || data.product_id,
      minQty: data.minQty || data.min_qty,
      preferredQty: data.preferredQty || data.preferred_qty,
    });
    const response = await api.post(API_ENDPOINTS.REORDER_RULES, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.reorder_rule || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.reorderRules.update(id, data);
      return result.data;
    }
    // Backend uses PATCH
    const requestData = toSnakeCase({
      minQty: data.minQty || data.min_qty,
      preferredQty: data.preferredQty !== undefined ? (data.preferredQty || data.preferred_qty) : undefined,
    });
    const response = await api.patch(`${API_ENDPOINTS.REORDER_RULES}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.reorder_rule || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.reorderRules.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.REORDER_RULES}/${id}`);
    return extractData(response, USE_MOCK);
  },
};


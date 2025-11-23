import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const productsAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.products.getAll(params);
      return result.data;
    }
    
    // Convert query params to snake_case for backend
    const queryParams = {
      page: params.page,
      limit: params.limit,
      search: params.search,
      category_id: params.categoryId || params.category_id,
      is_active: params.isActive !== undefined ? params.isActive : params.is_active,
    };
    
    const response = await api.get(API_ENDPOINTS.PRODUCTS, { 
      params: Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== undefined))
    });
    
    // Backend returns: { success: true, data: { products: [...], pagination: {...} } }
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.products || []).map(toCamelCase),
      total: responseData.pagination?.total || responseData.total || 0,
      page: responseData.pagination?.page || params.page || 1,
      limit: responseData.pagination?.limit || params.limit || 10,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.products.getById(id);
      return result.data;
    }
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.product || responseData);
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.products.create(data);
      return result.data;
    }
    
    // Convert to snake_case for backend
    const requestData = toSnakeCase({
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId || data.category_id,
      unitOfMeasure: data.unitOfMeasure || data.unit || data.unit_of_measure,
      isActive: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true),
      initialStock: data.initialStock || data.initial_stock || 0,
      initialLocationId: data.initialLocationId || data.initial_location_id,
      price: data.price,
      description: data.description,
    });
    
    const response = await api.post(API_ENDPOINTS.PRODUCTS, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.product || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.products.update(id, data);
      return result.data;
    }
    
    // Backend uses PATCH, convert to snake_case
    const requestData = toSnakeCase({
      name: data.name,
      categoryId: data.categoryId || data.category_id,
      unitOfMeasure: data.unitOfMeasure || data.unit || data.unit_of_measure,
      isActive: data.isActive !== undefined ? data.isActive : data.is_active,
    });
    
    const response = await api.patch(`${API_ENDPOINTS.PRODUCTS}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.product || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.products.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.PRODUCTS}/${id}`);
    return extractData(response, USE_MOCK);
  },
};


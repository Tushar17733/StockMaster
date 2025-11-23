import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const movesAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.moves.getAll(params);
      return result.data;
    }
    
    const queryParams = {
      page: params.page,
      limit: params.limit,
      product_id: params.productId || params.product_id,
      doc_type: params.docType || params.doc_type,
      status: params.status,
      warehouse_id: params.warehouseId || params.warehouse_id,
      location_id: params.locationId || params.location_id,
      date_from: params.dateFrom || params.date_from,
      date_to: params.dateTo || params.date_to,
    };
    
    const response = await api.get(API_ENDPOINTS.MOVES, {
      params: Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== undefined))
    });
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.moves || []).map(toCamelCase),
      total: responseData.pagination?.total || responseData.total || 0,
      page: responseData.pagination?.page || params.page || 1,
      limit: responseData.pagination?.limit || params.limit || 10,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.moves.getById(id);
      return result.data;
    }
    // Backend may not have getById for moves, but keep for mock compatibility
    const response = await api.get(`${API_ENDPOINTS.MOVES}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.move || responseData);
  },
};


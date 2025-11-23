import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { API_ENDPOINTS } from '../utils/constants';
import { extractData, toSnakeCase, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const documentsAPI = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.getAll(params);
      return result.data;
    }
    
    const queryParams = {
      page: params.page,
      limit: params.limit,
      doc_type: params.docType || params.doc_type,
      status: params.status,
      warehouse_id: params.warehouseId || params.warehouse_id,
      from_location_id: params.fromLocationId || params.from_location_id,
      to_location_id: params.toLocationId || params.to_location_id,
      date_from: params.dateFrom || params.date_from,
      date_to: params.dateTo || params.date_to,
    };
    
    const response = await api.get(API_ENDPOINTS.DOCUMENTS, {
      params: Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== undefined))
    });
    const responseData = extractData(response, USE_MOCK);
    return {
      data: (responseData.documents || []).map(toCamelCase),
      total: responseData.pagination?.total || responseData.total || 0,
      page: responseData.pagination?.page || params.page || 1,
      limit: responseData.pagination?.limit || params.limit || 10,
      pending: responseData.pending || 0,
    };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.getById(id);
      return result.data;
    }
    const response = await api.get(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
    const responseData = extractData(response, USE_MOCK);
    const document = toCamelCase(responseData.document || responseData);
    
    // Transform stockMoves to lines format for frontend compatibility
    if (document.stockMoves && !document.lines) {
      document.lines = document.stockMoves.map(move => ({
        productId: move.productId || move.product?.id,
        product: move.product,
        quantity: move.quantity,
        fromLocation: move.fromLocation,
        toLocation: move.toLocation,
      }));
    }
    
    // Map status values for frontend compatibility
    if (document.status === 'DONE') {
      document.status = 'validated';
    } else if (document.status === 'CANCELED') {
      document.status = 'cancelled';
    }
    
    return document;
  },

  create: async (data) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.create(data);
      return result.data;
    }
    
    // Convert document lines to backend format
    const lines = (data.lines || []).map(line => ({
      product_id: line.productId || line.product_id,
      quantity: line.quantity,
    }));
    
    const requestData = toSnakeCase({
      docType: data.docType || data.doc_type,
      status: data.status || 'DRAFT',
      fromLocationId: data.fromLocationId || data.from_location_id,
      toLocationId: data.toLocationId || data.to_location_id,
      supplierName: data.supplierName || data.supplier_name,
      customerName: data.customerName || data.customer_name,
      scheduledDate: data.scheduledDate || data.scheduled_date,
      lines: lines,
    });
    
    const response = await api.post(API_ENDPOINTS.DOCUMENTS, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.document || responseData);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.update(id, data);
      return result.data;
    }
    // Backend may not have update, but keep for mock compatibility
    const requestData = toSnakeCase(data);
    const response = await api.put(`${API_ENDPOINTS.DOCUMENTS}/${id}`, requestData);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.document || responseData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.delete(id);
      return result.data;
    }
    // Backend doesn't have delete endpoint, but keep for mock compatibility
    const response = await api.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
    return extractData(response, USE_MOCK);
  },

  validate: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.validate(id);
      return result.data;
    }
    const response = await api.post(`${API_ENDPOINTS.DOCUMENTS}/${id}/validate`);
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData.document || responseData);
  },

  cancel: async (id) => {
    if (USE_MOCK) {
      const result = await mockApi.documents.cancel(id);
      return result.data;
    }
    // Backend doesn't have cancel endpoint, but keep for mock compatibility
    const response = await api.post(`${API_ENDPOINTS.DOCUMENTS}/${id}/cancel`);
    return extractData(response, USE_MOCK);
  },
};


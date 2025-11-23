import api from '../services/api';
import { mockApi } from '../services/mockApi';
import { extractData, toCamelCase } from '../utils/apiHelpers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

export const dashboardAPI = {
  async getSummary() {
    if (USE_MOCK) {
      const result = await mockApi.dashboard.getSummary();
      return result.data;
    }
    const response = await api.get('/dashboard/summary');
    const responseData = extractData(response, USE_MOCK);
    return toCamelCase(responseData);
  },

  async getLowStockItems() {
    if (USE_MOCK) {
      const result = await mockApi.dashboard.getLowStockItems();
      return result.data;
    }
    const response = await api.get('/dashboard/low-stock-items');
    const responseData = extractData(response, USE_MOCK);
    // Backend returns: { success: true, data: { low_stock_items: [...] } }
    const camelCaseData = toCamelCase(responseData);
    return {
      lowStockItems: camelCaseData.lowStockItems || camelCaseData.low_stock_items || [],
    };
  },
};


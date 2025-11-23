// Helper utilities for API integration

// Extract data from backend response structure
// Backend returns: { success: true, data: {...} }
// We need to extract the nested data field
export const extractData = (response, USE_MOCK = false) => {
  if (USE_MOCK) {
    return response.data || response;
  }
  
  // Backend response structure: response.data = { success: true, data: {...} }
  // Extract the nested data field
  return response.data?.data || response.data || response;
};

// Convert camelCase to snake_case for backend requests
export const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      converted[snakeKey] = toSnakeCase(value);
    } else if (Array.isArray(value)) {
      converted[snakeKey] = value.map(item => 
        typeof item === 'object' && item !== null ? toSnakeCase(item) : item
      );
    } else {
      converted[snakeKey] = value;
    }
  }
  return converted;
};

// Convert snake_case to camelCase for frontend usage
export const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      converted[camelKey] = toCamelCase(value);
    } else if (Array.isArray(value)) {
      converted[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null ? toCamelCase(item) : item
      );
    } else {
      converted[camelKey] = value;
    }
  }
  return converted;
};


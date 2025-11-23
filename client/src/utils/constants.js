export const ROLES = {
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
};

export const STORAGE_KEYS = {
  TOKEN: 'stockmaster_token',
  USER: 'stockmaster_user',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    REQUEST_OTP: '/auth/request-otp',
    RESET_PASSWORD: '/auth/reset-password',
    GET_ME: '/auth/me',
  },
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  WAREHOUSES: '/warehouses',
  LOCATIONS: '/locations',
  DOCUMENTS: '/documents',
  MOVES: '/moves',
  REORDER_RULES: '/reorder-rules',
  PROFILE: '/users/me',
};


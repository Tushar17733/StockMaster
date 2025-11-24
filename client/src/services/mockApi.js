// Mock API service using localStorage for development/testing
// This allows the frontend to work without a backend

const STORAGE_PREFIX = 'stockmaster_mock_';

// Helper functions
const getStorageKey = (key) => `${STORAGE_PREFIX}${key}`;

const getFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(getStorageKey(key));
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initialize mock data if not exists
const initializeMockData = () => {
  if (!getFromStorage('initialized')) {
    // Initialize categories
    saveToStorage('categories', [
      { id: '1', name: 'Electronics', description: 'Electronic items', createdAt: new Date().toISOString() },
      { id: '2', name: 'Clothing', description: 'Clothing items', createdAt: new Date().toISOString() },
      { id: '3', name: 'Food & Beverages', description: 'Food and drink items', createdAt: new Date().toISOString() },
    ]);

    // Initialize warehouses
    saveToStorage('warehouses', [
      { id: '1', name: 'Main Warehouse', address: '123 Main St, City', createdAt: new Date().toISOString() },
      { id: '2', name: 'Secondary Warehouse', address: '456 Oak Ave, City', createdAt: new Date().toISOString() },
    ]);

    // Initialize locations
    saveToStorage('locations', [
      { id: '1', name: 'A-1', warehouseId: '1', type: 'Shelf', createdAt: new Date().toISOString() },
      { id: '2', name: 'A-2', warehouseId: '1', type: 'Shelf', createdAt: new Date().toISOString() },
      { id: '3', name: 'B-1', warehouseId: '2', type: 'Rack', createdAt: new Date().toISOString() },
    ]);

    // Initialize products
    saveToStorage('products', [
      {
        id: '1',
        name: 'Laptop',
        sku: 'LAP-001',
        categoryId: '1',
        price: 999.99,
        stock: 50,
        unit: 'pcs',
        description: 'High-performance laptop',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'T-Shirt',
        sku: 'TSH-001',
        categoryId: '2',
        price: 19.99,
        stock: 200,
        unit: 'pcs',
        description: 'Cotton t-shirt',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Coffee',
        sku: 'COF-001',
        categoryId: '3',
        price: 12.99,
        stock: 100,
        unit: 'box',
        description: 'Premium coffee beans',
        createdAt: new Date().toISOString(),
      },
    ]);

    // Initialize documents
    saveToStorage('documents', []);

    // Initialize moves
    saveToStorage('moves', []);

    // Initialize reorder rules
    saveToStorage('reorderRules', []);

    saveToStorage('initialized', true);
  }
};

// Initialize on import
initializeMockData();

// Mock API implementation
export const mockApi = {
  // Auth
  auth: {
    login: async (credentials) => {
      const users = getFromStorage('users', []);
      const user = users.find(
        (u) => u.email === credentials.email && u.password === credentials.password
      );

      if (!user) {
        throw { response: { data: { message: 'Invalid email or password' } } };
      }

      const token = `mock_token_${generateId()}`;
      const { password, ...userWithoutPassword } = user;

      return {
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    },

    signup: async (userData) => {
      const users = getFromStorage('users', []);
      
      // Check if user already exists
      if (users.find((u) => u.email === userData.email)) {
        throw { response: { data: { message: 'User with this email already exists' } } };
      }

      const newUser = {
        id: generateId(),
        ...userData,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveToStorage('users', users);

      const token = `mock_token_${generateId()}`;
      const { password, ...userWithoutPassword } = newUser;

      return {
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    },

    requestOTP: async (data) => {
      // Mock OTP request
      return { data: { message: 'OTP sent to email' } };
    },

    resetPassword: async (data) => {
      const users = getFromStorage('users', []);
      const userIndex = users.findIndex((u) => u.email === data.email);

      if (userIndex === -1) {
        throw { response: { data: { message: 'User not found' } } };
      }

      users[userIndex].password = data.newPassword;
      saveToStorage('users', users);

      return { data: { message: 'Password reset successfully' } };
    },

    verifyToken: async () => {
      return { data: { valid: true } };
    },
  },

  // Products
  products: {
    getAll: async (params = {}) => {
      const products = getFromStorage('products', []);
      const categories = getFromStorage('categories', []);

      // Enrich products with category data
      const enrichedProducts = products.map((product) => ({
        ...product,
        category: categories.find((c) => c.id === product.categoryId),
      }));

      // Simple pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        data: {
          data: enrichedProducts.slice(start, end),
          total: enrichedProducts.length,
          page,
          limit,
        },
      };
    },

    getById: async (id) => {
      const products = getFromStorage('products', []);
      const categories = getFromStorage('categories', []);
      const product = products.find((p) => p.id === id);

      if (!product) {
        throw { response: { status: 404, data: { message: 'Product not found' } } };
      }

      return {
        data: {
          ...product,
          category: categories.find((c) => c.id === product.categoryId),
        },
      };
    },

    create: async (data) => {
      const products = getFromStorage('products', []);
      const newProduct = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);
      saveToStorage('products', products);

      return { data: newProduct };
    },

    update: async (id, data) => {
      const products = getFromStorage('products', []);
      const index = products.findIndex((p) => p.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Product not found' } } };
      }

      products[index] = { ...products[index], ...data };
      saveToStorage('products', products);

      return { data: products[index] };
    },

    delete: async (id) => {
      const products = getFromStorage('products', []);
      const filtered = products.filter((p) => p.id !== id);
      saveToStorage('products', filtered);

      return { data: { message: 'Product deleted' } };
    },
  },

  // Categories
  categories: {
    getAll: async () => {
      const categories = getFromStorage('categories', []);
      return { data: { data: categories, total: categories.length } };
    },

    getById: async (id) => {
      const categories = getFromStorage('categories', []);
      const category = categories.find((c) => c.id === id);

      if (!category) {
        throw { response: { status: 404, data: { message: 'Category not found' } } };
      }

      return { data: category };
    },

    create: async (data) => {
      const categories = getFromStorage('categories', []);
      const newCategory = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      categories.push(newCategory);
      saveToStorage('categories', categories);

      return { data: newCategory };
    },

    update: async (id, data) => {
      const categories = getFromStorage('categories', []);
      const index = categories.findIndex((c) => c.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Category not found' } } };
      }

      categories[index] = { ...categories[index], ...data };
      saveToStorage('categories', categories);

      return { data: categories[index] };
    },

    delete: async (id) => {
      const categories = getFromStorage('categories', []);
      const filtered = categories.filter((c) => c.id !== id);
      saveToStorage('categories', filtered);

      return { data: { message: 'Category deleted' } };
    },
  },

  // Warehouses
  warehouses: {
    getAll: async () => {
      const warehouses = getFromStorage('warehouses', []);
      return { data: { data: warehouses, total: warehouses.length } };
    },

    getById: async (id) => {
      const warehouses = getFromStorage('warehouses', []);
      const warehouse = warehouses.find((w) => w.id === id);

      if (!warehouse) {
        throw { response: { status: 404, data: { message: 'Warehouse not found' } } };
      }

      return { data: warehouse };
    },

    create: async (data) => {
      const warehouses = getFromStorage('warehouses', []);
      const newWarehouse = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      warehouses.push(newWarehouse);
      saveToStorage('warehouses', warehouses);

      return { data: newWarehouse };
    },

    update: async (id, data) => {
      const warehouses = getFromStorage('warehouses', []);
      const index = warehouses.findIndex((w) => w.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Warehouse not found' } } };
      }

      warehouses[index] = { ...warehouses[index], ...data };
      saveToStorage('warehouses', warehouses);

      return { data: warehouses[index] };
    },

    delete: async (id) => {
      const warehouses = getFromStorage('warehouses', []);
      const filtered = warehouses.filter((w) => w.id !== id);
      saveToStorage('warehouses', filtered);

      return { data: { message: 'Warehouse deleted' } };
    },
  },

  // Locations
  locations: {
    getAll: async () => {
      const locations = getFromStorage('locations', []);
      const warehouses = getFromStorage('warehouses', []);

      const enriched = locations.map((location) => ({
        ...location,
        warehouse: warehouses.find((w) => w.id === location.warehouseId),
      }));

      return { data: { data: enriched, total: enriched.length } };
    },

    getById: async (id) => {
      const locations = getFromStorage('locations', []);
      const warehouses = getFromStorage('warehouses', []);
      const location = locations.find((l) => l.id === id);

      if (!location) {
        throw { response: { status: 404, data: { message: 'Location not found' } } };
      }

      return {
        data: {
          ...location,
          warehouse: warehouses.find((w) => w.id === location.warehouseId),
        },
      };
    },

    create: async (data) => {
      const locations = getFromStorage('locations', []);
      const newLocation = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      locations.push(newLocation);
      saveToStorage('locations', locations);

      return { data: newLocation };
    },

    update: async (id, data) => {
      const locations = getFromStorage('locations', []);
      const index = locations.findIndex((l) => l.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Location not found' } } };
      }

      locations[index] = { ...locations[index], ...data };
      saveToStorage('locations', locations);

      return { data: locations[index] };
    },

    delete: async (id) => {
      const locations = getFromStorage('locations', []);
      const filtered = locations.filter((l) => l.id !== id);
      saveToStorage('locations', filtered);

      return { data: { message: 'Location deleted' } };
    },
  },

  // Documents
  documents: {
    getAll: async (params = {}) => {
      const documents = getFromStorage('documents', []);
      const products = getFromStorage('products', []);

      // Enrich documents with product data in lines
      const enriched = documents.map((doc) => ({
        ...doc,
        lines: (doc.lines || []).map((line) => ({
          ...line,
          product: products.find((p) => p.id === line.productId),
        })),
      }));

      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        data: {
          data: enriched.slice(start, end),
          total: enriched.length,
          pending: enriched.filter((d) => d.status === 'draft').length,
        },
      };
    },

    getById: async (id) => {
      const documents = getFromStorage('documents', []);
      const products = getFromStorage('products', []);
      const document = documents.find((d) => d.id === id);

      if (!document) {
        throw { response: { status: 404, data: { message: 'Document not found' } } };
      }

      return {
        data: {
          ...document,
          lines: (document.lines || []).map((line) => ({
            ...line,
            product: products.find((p) => p.id === line.productId),
          })),
        },
      };
    },

    create: async (data) => {
      const documents = getFromStorage('documents', []);
      const newDocument = {
        id: generateId(),
        documentNumber: `DOC-${Date.now()}`,
        status: 'draft',
        ...data,
        createdAt: new Date().toISOString(),
      };

      documents.push(newDocument);
      saveToStorage('documents', documents);

      return { data: newDocument };
    },

    update: async (id, data) => {
      const documents = getFromStorage('documents', []);
      const index = documents.findIndex((d) => d.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Document not found' } } };
      }

      documents[index] = { ...documents[index], ...data };
      saveToStorage('documents', documents);

      return { data: documents[index] };
    },

    delete: async (id) => {
      const documents = getFromStorage('documents', []);
      const filtered = documents.filter((d) => d.id !== id);
      saveToStorage('documents', filtered);

      return { data: { message: 'Document deleted' } };
    },

    updateStatus: async (id, status) => {
      const documents = getFromStorage('documents', []);
      const index = documents.findIndex((d) => d.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Document not found' } } };
      }

      // Handle special statuses
      if (status === 'DONE') {
        documents[index].status = 'validated';
      } else if (status === 'CANCELED') {
        documents[index].status = 'cancelled';
      } else {
        documents[index].status = status.toLowerCase();
      }
      
      saveToStorage('documents', documents);

      return { data: documents[index] };
    },
  },

  // Moves
  moves: {
    getAll: async (params = {}) => {
      const moves = getFromStorage('moves', []);
      const products = getFromStorage('products', []);
      const locations = getFromStorage('locations', []);

      const enriched = moves.map((move) => ({
        ...move,
        product: products.find((p) => p.id === move.productId),
        fromLocation: locations.find((l) => l.id === move.fromLocationId),
        toLocation: locations.find((l) => l.id === move.toLocationId),
      }));

      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        data: {
          data: enriched.slice(start, end),
          total: enriched.length,
        },
      };
    },

    getById: async (id) => {
      const moves = getFromStorage('moves', []);
      const move = moves.find((m) => m.id === id);

      if (!move) {
        throw { response: { status: 404, data: { message: 'Move not found' } } };
      }

      return { data: move };
    },
  },

  // Reorder Rules
  reorderRules: {
    getAll: async () => {
      const rules = getFromStorage('reorderRules', []);
      const products = getFromStorage('products', []);

      const enriched = rules.map((rule) => ({
        ...rule,
        product: products.find((p) => p.id === rule.productId),
      }));

      return { data: { data: enriched, total: enriched.length } };
    },

    getById: async (id) => {
      const rules = getFromStorage('reorderRules', []);
      const rule = rules.find((r) => r.id === id);

      if (!rule) {
        throw { response: { status: 404, data: { message: 'Reorder rule not found' } } };
      }

      return { data: rule };
    },

    create: async (data) => {
      const rules = getFromStorage('reorderRules', []);
      const newRule = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      rules.push(newRule);
      saveToStorage('reorderRules', rules);

      return { data: newRule };
    },

    update: async (id, data) => {
      const rules = getFromStorage('reorderRules', []);
      const index = rules.findIndex((r) => r.id === id);

      if (index === -1) {
        throw { response: { status: 404, data: { message: 'Reorder rule not found' } } };
      }

      rules[index] = { ...rules[index], ...data };
      saveToStorage('reorderRules', rules);

      return { data: rules[index] };
    },

    delete: async (id) => {
      const rules = getFromStorage('reorderRules', []);
      const filtered = rules.filter((r) => r.id !== id);
      saveToStorage('reorderRules', filtered);

      return { data: { message: 'Reorder rule deleted' } };
    },
  },

  // Profile
  profile: {
    get: async () => {
      // Get current user from localStorage
      const userStr = localStorage.getItem('stockmaster_user');
      if (!userStr) {
        throw { response: { status: 401, data: { message: 'Not authenticated' } } };
      }

      return { data: JSON.parse(userStr) };
    },

    update: async (data) => {
      const userStr = localStorage.getItem('stockmaster_user');
      if (!userStr) {
        throw { response: { status: 401, data: { message: 'Not authenticated' } } };
      }

      const user = JSON.parse(userStr);
      const updatedUser = { ...user, ...data };

      // Update in users storage
      const users = getFromStorage('users', []);
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveToStorage('users', users);
      }

      // Update in localStorage
      localStorage.setItem('stockmaster_user', JSON.stringify(updatedUser));

      return { data: updatedUser };
    },
  },

  // Dashboard
  dashboard: {
    getSummary: async () => {
      const products = getFromStorage('products', []);
      const documents = getFromStorage('documents', []);
      const reorderRules = getFromStorage('reorderRules', []);

      // Calculate products in stock (products with stock > 0)
      const productsInStock = products.filter(p => (p.stock || 0) > 0).length;

      // Calculate low stock and out of stock
      let lowStockCount = 0;
      let outOfStockCount = 0;

      products.forEach(product => {
        const stock = product.stock || 0;
        const reorderRule = reorderRules.find(r => r.productId === product.id);
        
        if (stock === 0) {
          outOfStockCount++;
        } else if (reorderRule && stock < reorderRule.minQty) {
          lowStockCount++;
        }
      });

      // Count pending documents
      const pendingReceipts = documents.filter(
        d => d.docType === 'RECEIPT' && ['DRAFT', 'WAITING', 'READY'].includes(d.status)
      ).length;

      const pendingDeliveries = documents.filter(
        d => d.docType === 'DELIVERY' && ['DRAFT', 'WAITING', 'READY'].includes(d.status)
      ).length;

      const internalTransfers = documents.filter(
        d => d.docType === 'INTERNAL_TRANSFER' && !['DONE', 'CANCELED'].includes(d.status)
      ).length;

      return {
        data: {
          success: true,
          data: {
            total_products_in_stock: productsInStock,
            low_stock_items_count: lowStockCount,
            out_of_stock_items_count: outOfStockCount,
            pending_receipts_count: pendingReceipts,
            pending_deliveries_count: pendingDeliveries,
            internal_transfers_scheduled_count: internalTransfers,
          },
        },
      };
    },

    getLowStockItems: async () => {
      const products = getFromStorage('products', []);
      const categories = getFromStorage('categories', []);
      const reorderRules = getFromStorage('reorderRules', []);

      const lowStockItems = products
        .map(product => {
          const stock = product.stock || 0;
          const reorderRule = reorderRules.find(r => r.productId === product.id);
          const category = categories.find(c => c.id === product.categoryId);

          return {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            category: category ? { id: category.id, name: category.name } : null,
            total_qty: stock,
            min_qty: reorderRule?.minQty || 0,
            has_reorder_rule: !!reorderRule,
          };
        })
        .filter(item => item.has_reorder_rule && item.total_qty < item.min_qty)
        .sort((a, b) => a.total_qty - b.total_qty);

      return {
        data: {
          success: true,
          data: {
            low_stock_items: lowStockItems,
          },
        },
      };
    },
  },
};


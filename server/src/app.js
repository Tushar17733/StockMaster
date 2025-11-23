// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import warehouseRoutes from './modules/warehouses/routes.js';
import locationRoutes from './modules/locations/routes.js';
import categoryRoutes from './modules/categories/routes.js';
import productRoutes from './modules/products/routes.js';
import reorderRuleRoutes from './modules/reorder-rules/routes.js';
import stockQuantRoutes from './modules/stock-quants/routes.js';
import documentRoutes from './modules/documents/routes.js';
import moveRoutes from './modules/moves/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware for debugging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '[REDACTED]';
      console.log('Request body:', JSON.stringify(sanitizedBody, null, 2));
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StockMaster API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/warehouses', warehouseRoutes);
app.use('/locations', locationRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/reorder-rules', reorderRuleRoutes);
app.use('/stock-quants', stockQuantRoutes);
app.use('/documents', documentRoutes);
app.use('/moves', moveRoutes);
app.use('/dashboard', dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
// src/modules/dashboard/routes.js
import { Router } from 'express';
import { dashboardController } from './controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/summary', authenticate, dashboardController.getSummary);
router.get('/low-stock-items', authenticate, dashboardController.getLowStockItems);

export default router;
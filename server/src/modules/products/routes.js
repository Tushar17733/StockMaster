// src/modules/products/routes.js
import { Router } from 'express';
import { productsController } from './controller.js';
import { validate } from '../../middleware/validation.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema
} from './validation.js';

const router = Router();

router.get('/', validate(getProductsSchema), authenticate, productsController.getProducts);
router.post('/', validate(createProductSchema), authenticate, authorize('INVENTORY_MANAGER'), productsController.createProduct);
router.get('/:id', authenticate, productsController.getProduct);
router.patch('/:id', validate(updateProductSchema), authenticate, authorize('INVENTORY_MANAGER'), productsController.updateProduct);
router.get('/:id/stock', authenticate, productsController.getProductStock);

export default router;
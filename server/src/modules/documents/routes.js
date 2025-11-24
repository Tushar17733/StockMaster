// src/modules/documents/routes.js
import { Router } from 'express';
import { documentsController } from './controller.js';
import { validate } from '../../middleware/validation.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createDocumentSchema,
  getDocumentsSchema,
  stockAdjustmentSchema,
  deleteDocumentSchema,
  updateDocumentStatusSchema
} from './validation.js';

const router = Router();

router.get('/', validate(getDocumentsSchema), authenticate, documentsController.getDocuments);
router.post('/', validate(createDocumentSchema), authenticate, documentsController.createDocument);
router.get('/:id', authenticate, documentsController.getDocument);
router.post('/:id/validate', authenticate, authorize('INVENTORY_MANAGER'), documentsController.validateDocument);
router.post('/:id/cancel', authenticate, documentsController.cancelDocument);
router.put('/:id/status', validate(updateDocumentStatusSchema), authenticate, authorize('INVENTORY_MANAGER'), documentsController.updateDocumentStatus);
router.delete('/:id', validate(deleteDocumentSchema), authenticate, authorize('INVENTORY_MANAGER'), documentsController.deleteDocument);
router.post('/stock-adjustments', validate(stockAdjustmentSchema), authenticate, documentsController.createStockAdjustment);

export default router;
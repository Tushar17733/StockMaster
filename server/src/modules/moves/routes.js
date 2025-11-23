// src/modules/moves/routes.js
import { Router } from 'express';
import { movesController } from './controller.js';
import { validate } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { getMovesSchema } from './validation.js';

const router = Router();

router.get('/', validate(getMovesSchema), authenticate, movesController.getMoves);

export default router;
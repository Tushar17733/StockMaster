// src/modules/auth/routes.js
import { Router } from 'express';
import { authController } from './controller.js';
import { validate } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import {
  signupSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema
} from './validation.js';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/request-otp', validate(requestOtpSchema), authController.requestOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;
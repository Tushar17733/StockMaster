// src/modules/auth/validation.js
import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

export const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp_code: z.string().min(6, 'OTP must be 6 digits').max(6),
    new_password: z.string().min(6, 'Password must be at least 6 characters')
  })
});
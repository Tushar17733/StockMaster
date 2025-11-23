// src/modules/products/validation.js
import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    category_id: z.number().int().positive().optional(),
    unit_of_measure: z.string().min(1, 'Unit of measure is required'),
    is_active: z.boolean().default(true),
    initial_stock: z.number().min(0).optional(),
    initial_location_id: z.number().int().positive().optional()
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val))
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    category_id: z.number().int().positive().optional().nullable(),
    unit_of_measure: z.string().min(1).optional(),
    is_active: z.boolean().optional()
  })
});

export const getProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    is_active: z.string().transform(val => val === 'true').optional(),
    page: z.string().transform(val => parseInt(val)).default('1'),
    limit: z.string().transform(val => parseInt(val)).default('20')
  })
});
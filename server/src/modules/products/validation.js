// src/modules/products/validation.js
import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().optional().default(''),
    category_id: z.union([z.string(), z.null(), z.undefined()]).optional(),
    unit_of_measure: z.string().optional().default(''),
    is_active: z.boolean().optional().default(true),
    initial_stock: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional().default(0),
    initial_location_id: z.union([z.string(), z.null(), z.undefined()]).optional(),
    price: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional().default(0),
    description: z.string().optional().default(''),
    stock: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional().default(0)
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    category_id: z.union([z.string(), z.null(), z.undefined()]).optional(),
    unit_of_measure: z.string().optional(),
    is_active: z.boolean().optional(),
    price: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
    description: z.string().optional()
  })
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string()
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
// src/modules/documents/validation.js
import { z } from 'zod';

const stockMoveLineSchema = z.object({
  product_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  quantity: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).refine(val => val > 0, { message: 'Quantity must be positive' })
});

export const createDocumentSchema = z.object({
  body: z.object({
    doc_type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT']),
    status: z.enum(['DRAFT', 'WAITING', 'READY']).optional().default('DRAFT'),
    from_location_id: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
    to_location_id: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
    supplier_name: z.string().optional().default(''),
    customer_name: z.string().optional().default(''),
    scheduled_date: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional(),
    lines: z.array(stockMoveLineSchema).min(1, 'At least one line is required')
  })
});

export const getDocumentsSchema = z.object({
  query: z.object({
    doc_type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT']).optional(),
    status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
    warehouse_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    from_location_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    to_location_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    page: z.string().transform(val => parseInt(val)).default('1'),
    limit: z.string().transform(val => parseInt(val)).default('20')
  })
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    product_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
    location_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
    counted_quantity: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).refine(val => val >= 0, { message: 'Counted quantity must be non-negative' })
  })
});

export const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string()
  })
});

export const updateDocumentStatusSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'])
  })
});
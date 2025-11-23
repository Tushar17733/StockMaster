// src/modules/documents/validation.js
import { z } from 'zod';

const stockMoveLineSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().positive('Quantity must be positive')
});

export const createDocumentSchema = z.object({
  body: z.object({
    doc_type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT']),
    status: z.enum(['DRAFT', 'WAITING', 'READY']).default('DRAFT'),
    from_location_id: z.number().int().positive().optional(),
    to_location_id: z.number().int().positive().optional(),
    supplier_name: z.string().optional(),
    customer_name: z.string().optional(),
    scheduled_date: z.string().datetime().optional(),
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
    product_id: z.number().int().positive(),
    location_id: z.number().int().positive(),
    counted_quantity: z.number().min(0)
  })
});
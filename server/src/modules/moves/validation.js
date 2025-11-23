// src/modules/moves/validation.js
import { z } from 'zod';

export const getMovesSchema = z.object({
  query: z.object({
    product_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    doc_type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT']).optional(),
    status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
    warehouse_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    location_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    page: z.string().transform(val => parseInt(val)).default('1'),
    limit: z.string().transform(val => parseInt(val)).default('20')
  })
});
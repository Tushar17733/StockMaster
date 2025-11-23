// src/modules/stock-quants/routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { StockQuant, Product, Category, Location, Warehouse } from '../../models/index.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const getStockQuantsSchema = z.object({
  query: z.object({
    product_id: z.string().optional(),
    location_id: z.string().optional(),
    warehouse_id: z.string().optional()
  })
});

// GET /stock-quants
router.get('/', validate(getStockQuantsSchema), authenticate, async (req, res, next) => {
  try {
    const { product_id, location_id, warehouse_id } = req.query;

    const where = {};

    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      where.productId = new mongoose.Types.ObjectId(product_id);
    }

    if (location_id && mongoose.Types.ObjectId.isValid(location_id)) {
      where.locationId = new mongoose.Types.ObjectId(location_id);
    }

    // If warehouse_id is provided, filter by locations in that warehouse
    if (warehouse_id && mongoose.Types.ObjectId.isValid(warehouse_id)) {
      const locations = await Location.find({ warehouseId: warehouse_id }).select('_id').lean();
      const locationIds = locations.map(l => l._id);
      
      if (where.locationId) {
        // If location_id is also provided, ensure it's in the warehouse
        if (!locationIds.some(id => id.toString() === where.locationId.toString())) {
          return res.json({
            success: true,
            data: { stock_quants: [] }
          });
        }
      } else {
        where.locationId = { $in: locationIds };
      }
    }

    const stockQuants = await StockQuant.find(where)
      .populate({
        path: 'productId',
        populate: {
          path: 'categoryId',
          select: 'id name'
        }
      })
      .populate({
        path: 'locationId',
        populate: {
          path: 'warehouseId',
          select: 'id name code'
        }
      })
      .sort({ 'productId.name': 1, 'locationId.name': 1 })
      .lean();

    const stockQuantsResponse = stockQuants.map(quant => ({
      id: quant._id,
      productId: quant.productId?._id || quant.productId,
      product: quant.productId ? {
        id: quant.productId._id || quant.productId.id,
        name: quant.productId.name,
        sku: quant.productId.sku,
        category: quant.productId.categoryId ? {
          id: quant.productId.categoryId._id || quant.productId.categoryId.id,
          name: quant.productId.categoryId.name
        } : null
      } : null,
      locationId: quant.locationId?._id || quant.locationId,
      location: quant.locationId ? {
        id: quant.locationId._id || quant.locationId.id,
        name: quant.locationId.name,
        warehouse: quant.locationId.warehouseId ? {
          id: quant.locationId.warehouseId._id || quant.locationId.warehouseId.id,
          name: quant.locationId.warehouseId.name,
          code: quant.locationId.warehouseId.code
        } : null
      } : null,
      quantity: quant.quantity,
      createdAt: quant.createdAt,
      updatedAt: quant.updatedAt
    }));

    res.json({
      success: true,
      data: { stock_quants: stockQuantsResponse }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// src/modules/reorder-rules/routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { ReorderRule, Product, Category, StockQuant } from '../../models/index.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const createReorderRuleSchema = z.object({
  body: z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    min_qty: z.number().min(0, 'Minimum quantity must be non-negative'),
    preferred_qty: z.number().min(0).optional()
  })
});

const updateReorderRuleSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    min_qty: z.number().min(0).optional(),
    preferred_qty: z.number().min(0).optional().nullable()
  })
});

const getReorderRulesSchema = z.object({
  query: z.object({
    product_id: z.string().optional()
  })
});

// GET /reorder-rules
router.get('/', validate(getReorderRulesSchema), authenticate, async (req, res, next) => {
  try {
    const { product_id } = req.query;

    const where = {};
    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      where.productId = new mongoose.Types.ObjectId(product_id);
    }

    const reorderRules = await ReorderRule.find(where)
      .populate({
        path: 'productId',
        populate: {
          path: 'categoryId',
          select: 'id name'
        }
      })
      .lean();

    // Get stock quants for products
    const productIds = reorderRules.map(rr => rr.productId._id || rr.productId);
    const stockQuants = await StockQuant.find({ productId: { $in: productIds } })
      .lean();

    // Add current total quantity to each rule
    const rulesWithStock = reorderRules.map(rule => {
      const productId = rule.productId._id || rule.productId;
      const productStockQuants = stockQuants.filter(
        sq => sq.productId.toString() === productId.toString()
      );
      const totalQty = productStockQuants.reduce(
        (sum, quant) => sum + quant.quantity, 0
      );

      return {
        id: rule._id,
        productId: productId,
        product: {
          id: productId,
          name: rule.productId.name,
          sku: rule.productId.sku,
          category: rule.productId.categoryId ? {
            id: rule.productId.categoryId._id || rule.productId.categoryId.id,
            name: rule.productId.categoryId.name
          } : null
        },
        minQty: rule.minQty,
        preferredQty: rule.preferredQty,
        current_total_qty: totalQty,
        is_low_stock: totalQty < rule.minQty,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    });

    res.json({
      success: true,
      data: { reorder_rules: rulesWithStock }
    });
  } catch (error) {
    next(error);
  }
});

// POST /reorder-rules
router.post('/', validate(createReorderRuleSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { product_id, min_qty, preferred_qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const product = await Product.findById(product_id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if rule already exists for this product
    const existingRule = await ReorderRule.findOne({ productId: product_id });

    if (existingRule) {
      return res.status(409).json({
        success: false,
        message: 'Reorder rule already exists for this product'
      });
    }

    const reorderRule = await ReorderRule.create({
      productId: product_id,
      minQty: min_qty,
      preferredQty: preferred_qty
    });

    await reorderRule.populate('productId', 'id name sku');

    res.status(201).json({
      success: true,
      message: 'Reorder rule created successfully',
      data: { 
        reorder_rule: {
          id: reorderRule._id,
          productId: reorderRule.productId._id,
          product: {
            id: reorderRule.productId._id,
            name: reorderRule.productId.name,
            sku: reorderRule.productId.sku
          },
          minQty: reorderRule.minQty,
          preferredQty: reorderRule.preferredQty,
          createdAt: reorderRule.createdAt,
          updatedAt: reorderRule.updatedAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Reorder rule already exists for this product'
      });
    }
    next(error);
  }
});

// PATCH /reorder-rules/:id
router.patch('/:id', validate(updateReorderRuleSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { min_qty, preferred_qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reorder rule ID'
      });
    }

    const reorderRule = await ReorderRule.findById(id);

    if (!reorderRule) {
      return res.status(404).json({
        success: false,
        message: 'Reorder rule not found'
      });
    }

    const updateData = {};
    if (min_qty !== undefined) updateData.minQty = min_qty;
    if (preferred_qty !== undefined) updateData.preferredQty = preferred_qty;

    const updatedReorderRule = await ReorderRule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('productId', 'id name sku');

    res.json({
      success: true,
      message: 'Reorder rule updated successfully',
      data: { 
        reorder_rule: {
          id: updatedReorderRule._id,
          productId: updatedReorderRule.productId._id,
          product: {
            id: updatedReorderRule.productId._id,
            name: updatedReorderRule.productId.name,
            sku: updatedReorderRule.productId.sku
          },
          minQty: updatedReorderRule.minQty,
          preferredQty: updatedReorderRule.preferredQty,
          createdAt: updatedReorderRule.createdAt,
          updatedAt: updatedReorderRule.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

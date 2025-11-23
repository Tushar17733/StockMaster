// src/modules/categories/routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { Category, Product } from '../../models/index.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional()
  })
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional()
  })
});

// GET /categories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = await Category.find()
      .select('id name description createdAt updatedAt')
      .lean();

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ categoryId: category._id });
        return {
          id: category._id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          _count: {
            products: productCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: { categories: categoriesWithCounts }
    });
  } catch (error) {
    next(error);
  }
});

// POST /categories
router.post('/', validate(createCategorySchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await Category.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { 
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    next(error);
  }
});

// GET /categories/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products with stock quants
    const products = await Product.find({ categoryId: id })
      .populate('categoryId', 'id name')
      .lean();

    const productIds = products.map(p => p._id);
    const { StockQuant } = await import('../../models/index.js');
    const stockQuants = await StockQuant.find({ productId: { $in: productIds } })
      .lean();

    const categoryResponse = {
      id: category._id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      products: products.map(product => {
        const productStockQuants = stockQuants.filter(
          sq => sq.productId.toString() === product._id.toString()
        );
        return {
          ...product,
          id: product._id,
          stockQuants: productStockQuants.map(sq => ({
            id: sq._id,
            productId: sq.productId,
            locationId: sq.locationId,
            quantity: sq.quantity
          }))
        };
      })
    };

    res.json({
      success: true,
      data: { category: categoryResponse }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /categories/:id
router.patch('/:id', validate(updateCategorySchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: {
          id: updatedCategory._id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          createdAt: updatedCategory.createdAt,
          updatedAt: updatedCategory.updatedAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    next(error);
  }
});

export default router;

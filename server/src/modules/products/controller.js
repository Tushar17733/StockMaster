// src/modules/products/controller.js
import mongoose from 'mongoose';
import { Product, Category, StockQuant, Location, Warehouse, Document, StockMove } from '../../models/index.js';

export const productsController = {
  async getProducts(req, res, next) {
    try {
      const { search, category_id, is_active, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      if (search) {
        where.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }

      if (category_id) {
        if (mongoose.Types.ObjectId.isValid(category_id)) {
          where.categoryId = new mongoose.Types.ObjectId(category_id);
        } else {
          where.categoryId = category_id;
        }
      }

      if (is_active !== undefined) {
        where.isActive = is_active === 'true' || is_active === true;
      }

      // Get products with total count
      const [products, total] = await Promise.all([
        Product.find(where)
          .populate({
            path: 'categoryId',
            select: 'id name',
            transform: (doc) => ({ id: doc._id, name: doc.name })
          })
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ name: 1 })
          .lean(),
        Product.countDocuments(where)
      ]);

      // Get stock quants for all products
      const productIds = products.map(p => p._id);
      const stockQuants = await StockQuant.find({ productId: { $in: productIds } })
        .populate({
          path: 'locationId',
          populate: {
            path: 'warehouseId',
            select: 'id name code',
            transform: (doc) => ({ id: doc._id, name: doc.name, code: doc.code })
          },
          select: 'id name warehouseId',
          transform: (doc) => ({
            id: doc._id,
            name: doc.name,
            warehouse: doc.warehouseId
          })
        })
        .lean();

      // Get reorder rules
      const { ReorderRule } = await import('../../models/index.js');
      const reorderRules = await ReorderRule.find({ productId: { $in: productIds } })
        .lean();

      // Calculate total quantity per product
      const productsWithStock = products.map(product => {
        const productStockQuants = stockQuants.filter(sq => sq.productId.toString() === product._id.toString());
        const totalQuantity = productStockQuants.reduce(
          (sum, quant) => sum + quant.quantity, 0
        );

        const productReorderRule = reorderRules.find(rr => rr.productId.toString() === product._id.toString());

        return {
          id: product._id,
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId?._id || product.categoryId,
          category: product.categoryId ? { id: product.categoryId._id || product.categoryId.id, name: product.categoryId.name } : null,
          unitOfMeasure: product.unitOfMeasure,
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          total_quantity: totalQuantity,
          reorderRules: productReorderRule ? [{
            id: productReorderRule._id,
            productId: productReorderRule.productId,
            minQty: productReorderRule.minQty,
            preferredQty: productReorderRule.preferredQty
          }] : [],
          stock_breakdown: productStockQuants.map(quant => ({
            location_id: quant.locationId?._id || quant.locationId?.id,
            location_name: quant.locationId?.name,
            warehouse_id: quant.locationId?.warehouse?._id || quant.locationId?.warehouse?.id,
            warehouse_name: quant.locationId?.warehouse?.name,
            quantity: quant.quantity
          }))
        };
      });

      res.json({
        success: true,
        data: {
          products: productsWithStock,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req, res, next) {
    try {
      const { 
        name, 
        sku, 
        category_id, 
        unit_of_measure, 
        is_active = true,
        initial_stock = 0,
        initial_location_id 
      } = req.body;

      // Check if SKU already exists
      const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      let product;

      // If initial stock is provided, create product with initial stock adjustment
      if (initial_stock > 0 && initial_location_id) {
        // Verify location exists
        const location = await Location.findById(initial_location_id);

        if (!location) {
          return res.status(404).json({
            success: false,
            message: 'Initial location not found'
          });
        }

        // Create product and initial stock in transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Create product
          const newProduct = await Product.create([{
            name,
            sku: sku.toUpperCase(),
            categoryId: category_id,
            unitOfMeasure: unit_of_measure,
            isActive: is_active
          }], { session });

          const createdProduct = newProduct[0];

          // Create initial stock quant
          await StockQuant.create([{
            productId: createdProduct._id,
            locationId: initial_location_id,
            quantity: initial_stock
          }], { session });

          // Create adjustment document for audit trail
          const adjustmentDoc = await Document.create([{
            docNumber: `ADJ-${Date.now()}`,
            docType: 'ADJUSTMENT',
            status: 'DONE',
            fromLocationId: initial_location_id,
            toLocationId: initial_location_id,
            createdById: req.user.id,
            validatedById: req.user.id,
            validatedAt: new Date()
          }], { session });

          // Create stock move for initial stock
          await StockMove.create([{
            documentId: adjustmentDoc[0]._id,
            productId: createdProduct._id,
            fromLocationId: null,
            toLocationId: initial_location_id,
            quantity: initial_stock
          }], { session });

          await session.commitTransaction();
          product = createdProduct;
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }

        // Populate category
        await product.populate('categoryId', 'id name');
      } else {
        // Create product without initial stock
        product = await Product.create({
          name,
          sku: sku.toUpperCase(),
          categoryId: category_id,
          unitOfMeasure: unit_of_measure,
          isActive: is_active
        });

        await product.populate('categoryId', 'id name');
      }

      const productResponse = {
        id: product._id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId?._id || product.categoryId,
        category: product.categoryId ? { id: product.categoryId._id || product.categoryId.id, name: product.categoryId.name } : null,
        unitOfMeasure: product.unitOfMeasure,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product: productResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async getProduct(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id)
        .populate('categoryId', 'id name')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get reorder rules
      const { ReorderRule } = await import('../../models/index.js');
      const reorderRules = await ReorderRule.find({ productId: id }).lean();

      // Get stock quants
      const stockQuants = await StockQuant.find({ productId: id })
        .populate({
          path: 'locationId',
          populate: {
            path: 'warehouseId',
            select: 'id name code'
          }
        })
        .lean();

      // Calculate total quantity
      const totalQuantity = stockQuants.reduce(
        (sum, quant) => sum + quant.quantity, 0
      );

      const response = {
        id: product._id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId?._id || product.categoryId,
        category: product.categoryId ? { id: product.categoryId._id || product.categoryId.id, name: product.categoryId.name } : null,
        unitOfMeasure: product.unitOfMeasure,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        total_quantity: totalQuantity,
        reorderRules: reorderRules.map(rr => ({
          id: rr._id,
          productId: rr.productId,
          minQty: rr.minQty,
          preferredQty: rr.preferredQty
        })),
        stockQuants: stockQuants.map(sq => ({
          id: sq._id,
          productId: sq.productId,
          locationId: sq.locationId?._id || sq.locationId?.id,
          location: sq.locationId ? {
            id: sq.locationId._id || sq.locationId.id,
            name: sq.locationId.name,
            warehouse: sq.locationId.warehouseId ? {
              id: sq.locationId.warehouseId._id || sq.locationId.warehouseId.id,
              name: sq.locationId.warehouseId.name,
              code: sq.locationId.warehouseId.code
            } : null
          } : null,
          quantity: sq.quantity
        }))
      };

      res.json({
        success: true,
        data: { product: response }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { name, category_id, unit_of_measure, is_active } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (category_id !== undefined) updateData.categoryId = category_id;
      if (unit_of_measure !== undefined) updateData.unitOfMeasure = unit_of_measure;
      if (is_active !== undefined) updateData.isActive = is_active;

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('categoryId', 'id name');

      const productResponse = {
        id: updatedProduct._id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        categoryId: updatedProduct.categoryId?._id || updatedProduct.categoryId,
        category: updatedProduct.categoryId ? { id: updatedProduct.categoryId._id || updatedProduct.categoryId.id, name: updatedProduct.categoryId.name } : null,
        unitOfMeasure: updatedProduct.unitOfMeasure,
        isActive: updatedProduct.isActive,
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt
      };

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product: productResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductStock(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const stockQuants = await StockQuant.find({ productId: id })
        .populate({
          path: 'locationId',
          populate: {
            path: 'warehouseId',
            select: 'id name code'
          }
        })
        .lean();

      const totalQuantity = stockQuants.reduce(
        (sum, quant) => sum + quant.quantity, 0
      );

      res.json({
        success: true,
        data: {
          product_id: id,
          total_quantity: totalQuantity,
          stock_breakdown: stockQuants.map(quant => ({
            location_id: quant.locationId?._id || quant.locationId?.id,
            location_name: quant.locationId?.name,
            warehouse_id: quant.locationId?.warehouseId?._id || quant.locationId?.warehouseId?.id,
            warehouse_name: quant.locationId?.warehouseId?.name,
            quantity: quant.quantity
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

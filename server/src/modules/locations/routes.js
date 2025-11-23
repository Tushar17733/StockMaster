// src/modules/locations/routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { Location, Warehouse, StockQuant, Product } from '../../models/index.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const createLocationSchema = z.object({
  body: z.object({
    warehouse_id: z.string().min(1, 'Warehouse ID is required'),
    name: z.string().min(1, 'Name is required'),
    location_type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'ADJUSTMENT'])
  })
});

const updateLocationSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    location_type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'ADJUSTMENT']).optional()
  })
});

const getLocationsSchema = z.object({
  query: z.object({
    warehouse_id: z.string().optional(),
    location_type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'ADJUSTMENT']).optional()
  })
});

// GET /locations
router.get('/', validate(getLocationsSchema), authenticate, async (req, res, next) => {
  try {
    const { warehouse_id, location_type } = req.query;

    const where = {};
    if (warehouse_id && mongoose.Types.ObjectId.isValid(warehouse_id)) {
      where.warehouseId = new mongoose.Types.ObjectId(warehouse_id);
    }
    if (location_type) {
      where.locationType = location_type;
    }

    const locations = await Location.find(where)
      .populate({
        path: 'warehouseId',
        select: 'id name code'
      })
      .lean();

    // Get stock quants for all locations
    const locationIds = locations.map(l => l._id);
    const stockQuants = await StockQuant.find({ locationId: { $in: locationIds } })
      .populate('productId', 'id name sku')
      .lean();

    const locationsResponse = locations.map(location => {
      const locationStockQuants = stockQuants.filter(
        sq => sq.locationId.toString() === location._id.toString()
      );
      return {
        id: location._id,
        name: location.name,
        locationType: location.locationType,
        warehouseId: location.warehouseId?._id || location.warehouseId,
        warehouse: location.warehouseId ? {
          id: location.warehouseId._id || location.warehouseId.id,
          name: location.warehouseId.name,
          code: location.warehouseId.code
        } : null,
        stockQuants: locationStockQuants.map(sq => ({
          id: sq._id,
          productId: sq.productId?._id || sq.productId,
          product: sq.productId ? {
            id: sq.productId._id || sq.productId.id,
            name: sq.productId.name,
            sku: sq.productId.sku
          } : null,
          quantity: sq.quantity
        })),
        createdAt: location.createdAt,
        updatedAt: location.updatedAt
      };
    });

    res.json({
      success: true,
      data: { locations: locationsResponse }
    });
  } catch (error) {
    next(error);
  }
});

// POST /locations
router.post('/', validate(createLocationSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { warehouse_id, name, location_type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(warehouse_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID'
      });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findById(warehouse_id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    const location = await Location.create({
      warehouseId: warehouse_id,
      name,
      locationType: location_type
    });

    await location.populate('warehouseId', 'id name code');

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: { 
        location: {
          id: location._id,
          name: location.name,
          locationType: location.locationType,
          warehouseId: location.warehouseId._id,
          warehouse: {
            id: location.warehouseId._id,
            name: location.warehouseId.name,
            code: location.warehouseId.code
          },
          createdAt: location.createdAt,
          updatedAt: location.updatedAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Location with this name already exists in this warehouse'
      });
    }
    next(error);
  }
});

// GET /locations/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await Location.findById(id)
      .populate('warehouseId', 'id name code')
      .lean();

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Get stock quants with products
    const stockQuants = await StockQuant.find({ locationId: id })
      .populate({
        path: 'productId',
        populate: {
          path: 'categoryId',
          select: 'id name'
        }
      })
      .lean();

    const locationResponse = {
      id: location._id,
      name: location.name,
      locationType: location.locationType,
      warehouseId: location.warehouseId?._id || location.warehouseId,
      warehouse: location.warehouseId ? {
        id: location.warehouseId._id || location.warehouseId.id,
        name: location.warehouseId.name,
        code: location.warehouseId.code
      } : null,
      stockQuants: stockQuants.map(sq => ({
        id: sq._id,
        productId: sq.productId?._id || sq.productId,
        product: sq.productId ? {
          id: sq.productId._id || sq.productId.id,
          name: sq.productId.name,
          sku: sq.productId.sku,
          category: sq.productId.categoryId ? {
            id: sq.productId.categoryId._id || sq.productId.categoryId.id,
            name: sq.productId.categoryId.name
          } : null
        } : null,
        quantity: sq.quantity
      })),
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    };

    res.json({
      success: true,
      data: { location: locationResponse }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /locations/:id
router.patch('/:id', validate(updateLocationSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location_type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location_type !== undefined) updateData.locationType = location_type;

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('warehouseId', 'id name code');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { 
        location: {
          id: updatedLocation._id,
          name: updatedLocation.name,
          locationType: updatedLocation.locationType,
          warehouseId: updatedLocation.warehouseId._id,
          warehouse: {
            id: updatedLocation.warehouseId._id,
            name: updatedLocation.warehouseId.name,
            code: updatedLocation.warehouseId.code
          },
          createdAt: updatedLocation.createdAt,
          updatedAt: updatedLocation.updatedAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Location with this name already exists in this warehouse'
      });
    }
    next(error);
  }
});

export default router;

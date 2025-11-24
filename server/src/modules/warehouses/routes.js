// src/modules/warehouses/routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { Warehouse, Location, StockQuant, Product, User } from '../../models/index.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().optional(),
    address: z.string().optional()
  })
});

const updateWarehouseSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    address: z.string().optional()
  })
});

const deleteWarehouseSchema = z.object({
  params: z.object({
    id: z.string()
  })
});

// GET /warehouses
router.get('/', authenticate, async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().lean();

    // Get locations for each warehouse
    const warehouseIds = warehouses.map(w => w._id);
    const locations = await Location.find({ warehouseId: { $in: warehouseIds } }).lean();

    // Get user counts
    const userCounts = await User.aggregate([
      { $match: { defaultWarehouseId: { $in: warehouseIds } } },
      { $group: { _id: '$defaultWarehouseId', count: { $sum: 1 } } }
    ]);

    const warehousesResponse = await Promise.all(
      warehouses.map(async (warehouse) => {
        const warehouseLocations = locations.filter(
          l => l.warehouseId.toString() === warehouse._id.toString()
        );
        const userCount = userCounts.find(uc => uc._id?.toString() === warehouse._id.toString())?.count || 0;

        return {
          id: warehouse._id,
          name: warehouse.name,
          code: warehouse.code,
          address: warehouse.address,
          locations: warehouseLocations.map(l => ({
            id: l._id,
            name: l.name,
            locationType: l.locationType,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt
          })),
          _count: {
            locations: warehouseLocations.length,
            users: userCount
          },
          createdAt: warehouse.createdAt,
          updatedAt: warehouse.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: { warehouses: warehousesResponse }
    });
  } catch (error) {
    next(error);
  }
});

// POST /warehouses
router.post('/', validate(createWarehouseSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { name, code, address } = req.body;

    const warehouse = await Warehouse.create({ name, code, address });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { 
        warehouse: {
          id: warehouse._id,
          name: warehouse.name,
          code: warehouse.code,
          address: warehouse.address,
          createdAt: warehouse.createdAt,
          updatedAt: warehouse.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /warehouses/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID'
      });
    }

    const warehouse = await Warehouse.findById(id).lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Get locations with stock quants
    const locations = await Location.find({ warehouseId: id }).lean();
    const locationIds = locations.map(l => l._id);
    
    const stockQuants = await StockQuant.find({ locationId: { $in: locationIds } })
      .populate('productId', 'id name sku')
      .lean();

    const warehouseResponse = {
      id: warehouse._id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      locations: locations.map(location => {
        const locationStockQuants = stockQuants.filter(
          sq => sq.locationId.toString() === location._id.toString()
        );
        return {
          id: location._id,
          name: location.name,
          locationType: location.locationType,
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
      }),
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt
    };

    res.json({
      success: true,
      data: { warehouse: warehouseResponse }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /warehouses/:id
router.patch('/:id', validate(updateWarehouseSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, address } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID'
      });
    }

    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (address !== undefined) updateData.address = address;

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: { 
        warehouse: {
          id: updatedWarehouse._id,
          name: updatedWarehouse.name,
          code: updatedWarehouse.code,
          address: updatedWarehouse.address,
          createdAt: updatedWarehouse.createdAt,
          updatedAt: updatedWarehouse.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /warehouses/:id
router.delete('/:id', validate(deleteWarehouseSchema), authenticate, authorize('INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID'
      });
    }

    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if warehouse has locations
    const locationCount = await Location.countDocuments({ warehouseId: id });

    if (locationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warehouse with ${locationCount} location(s). Please delete the locations first.`
      });
    }

    // Check if any users have this as default warehouse
    const userCount = await User.countDocuments({ defaultWarehouseId: id });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warehouse. ${userCount} user(s) have this as their default warehouse.`
      });
    }

    await Warehouse.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

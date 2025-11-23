// src/modules/users/routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import mongoose from 'mongoose';
import { User, Warehouse } from '../../models/index.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    default_warehouse_id: z.string().optional().nullable()
  })
});

// GET /users/me - Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('defaultWarehouseId', 'id name code')
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      defaultWarehouse: user.defaultWarehouseId ? {
        id: user.defaultWarehouseId._id || user.defaultWarehouseId.id,
        name: user.defaultWarehouseId.name,
        code: user.defaultWarehouseId.code
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /users/me - Update current user profile
router.put('/me', validate(updateProfileSchema), authenticate, async (req, res, next) => {
  try {
    const { name, phone, default_warehouse_id } = req.body;

    // Verify warehouse exists if provided
    if (default_warehouse_id !== undefined && default_warehouse_id !== null) {
      if (!mongoose.Types.ObjectId.isValid(default_warehouse_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid warehouse ID'
        });
      }

      const warehouse = await Warehouse.findById(default_warehouse_id);

      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (default_warehouse_id !== undefined) {
      updateData.defaultWarehouseId = default_warehouse_id === null ? null : default_warehouse_id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('defaultWarehouseId', 'id name code')
      .select('-passwordHash')
      .lean();

    const userResponse = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      defaultWarehouse: updatedUser.defaultWarehouseId ? {
        id: updatedUser.defaultWarehouseId._id || updatedUser.defaultWarehouseId.id,
        name: updatedUser.defaultWarehouseId.name,
        code: updatedUser.defaultWarehouseId.code
      } : null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

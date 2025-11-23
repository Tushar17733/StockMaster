// src/modules/moves/controller.js
import mongoose from 'mongoose';
import { StockMove, Document, Product, Location, Warehouse } from '../../models/index.js';

export const movesController = {
  async getMoves(req, res, next) {
    try {
      const {
        product_id,
        doc_type,
        status,
        warehouse_id,
        location_id,
        date_from,
        date_to,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (product_id) {
        where.productId = mongoose.Types.ObjectId.isValid(product_id) 
          ? new mongoose.Types.ObjectId(product_id) 
          : product_id;
      }

      // If doc_type or status is provided, filter by document
      if (doc_type || status) {
        const docWhere = {};
        if (doc_type) docWhere.docType = doc_type;
        if (status) docWhere.status = status;
        const docs = await Document.find(docWhere).select('_id').lean();
        where.documentId = { $in: docs.map(d => d._id) };
      }

      // If warehouse_id is provided, filter by locations
      if (warehouse_id || location_id) {
        const locationWhere = {};
        if (location_id) {
          locationWhere._id = mongoose.Types.ObjectId.isValid(location_id) 
            ? new mongoose.Types.ObjectId(location_id) 
            : location_id;
        } else if (warehouse_id) {
          locationWhere.warehouseId = mongoose.Types.ObjectId.isValid(warehouse_id) 
            ? new mongoose.Types.ObjectId(warehouse_id) 
            : warehouse_id;
        }
        
        const locations = await Location.find(locationWhere).select('_id').lean();
        const locationIds = locations.map(l => l._id);
        
        where.$or = [
          { fromLocationId: { $in: locationIds } },
          { toLocationId: { $in: locationIds } }
        ];
      }

      if (date_from || date_to) {
        where.createdAt = {};
        if (date_from) where.createdAt.$gte = new Date(date_from);
        if (date_to) where.createdAt.$lte = new Date(date_to);
      }

      // Get moves with total count
      const [moves, total] = await Promise.all([
        StockMove.find(where)
          .populate({
            path: 'documentId',
            select: 'id docNumber docType status'
          })
          .populate({
            path: 'productId',
            select: 'id sku name unitOfMeasure'
          })
          .populate({
            path: 'fromLocationId',
            populate: {
              path: 'warehouseId',
              select: 'id name code'
            }
          })
          .populate({
            path: 'toLocationId',
            populate: {
              path: 'warehouseId',
              select: 'id name code'
            }
          })
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 })
          .lean(),
        StockMove.countDocuments(where)
      ]);

      const movesResponse = moves.map(move => ({
        id: move._id,
        documentId: move.documentId?._id || move.documentId,
        document: move.documentId ? {
          id: move.documentId._id || move.documentId.id,
          docNumber: move.documentId.docNumber,
          docType: move.documentId.docType,
          status: move.documentId.status
        } : null,
        productId: move.productId?._id || move.productId,
        product: move.productId ? {
          id: move.productId._id || move.productId.id,
          sku: move.productId.sku,
          name: move.productId.name,
          unitOfMeasure: move.productId.unitOfMeasure
        } : null,
        fromLocationId: move.fromLocationId?._id || move.fromLocationId,
        fromLocation: move.fromLocationId ? {
          id: move.fromLocationId._id || move.fromLocationId.id,
          name: move.fromLocationId.name,
          warehouse: move.fromLocationId.warehouseId ? {
            id: move.fromLocationId.warehouseId._id || move.fromLocationId.warehouseId.id,
            name: move.fromLocationId.warehouseId.name,
            code: move.fromLocationId.warehouseId.code
          } : null
        } : null,
        toLocationId: move.toLocationId?._id || move.toLocationId,
        toLocation: move.toLocationId ? {
          id: move.toLocationId._id || move.toLocationId.id,
          name: move.toLocationId.name,
          warehouse: move.toLocationId.warehouseId ? {
            id: move.toLocationId.warehouseId._id || move.toLocationId.warehouseId.id,
            name: move.toLocationId.warehouseId.name,
            code: move.toLocationId.warehouseId.code
          } : null
        } : null,
        quantity: move.quantity,
        createdAt: move.createdAt,
        updatedAt: move.updatedAt
      }));

      res.json({
        success: true,
        data: {
          moves: movesResponse,
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
  }
};

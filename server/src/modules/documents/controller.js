// src/modules/documents/controller.js
import mongoose from 'mongoose';
import { Document, StockMove, StockQuant, Location, Warehouse, Product, User } from '../../models/index.js';

export const documentsController = {
  async getDocuments(req, res, next) {
    try {
      const { 
        doc_type, 
        status, 
        warehouse_id, 
        from_location_id, 
        to_location_id, 
        date_from, 
        date_to,
        page = 1, 
        limit = 20 
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (doc_type) {
        where.docType = doc_type;
      }

      if (status) {
        where.status = status;
      }

      if (from_location_id) {
        where.fromLocationId = mongoose.Types.ObjectId.isValid(from_location_id) 
          ? new mongoose.Types.ObjectId(from_location_id) 
          : from_location_id;
      }

      if (to_location_id) {
        where.toLocationId = mongoose.Types.ObjectId.isValid(to_location_id) 
          ? new mongoose.Types.ObjectId(to_location_id) 
          : to_location_id;
      }

      if (date_from || date_to) {
        where.createdAt = {};
        if (date_from) where.createdAt.$gte = new Date(date_from);
        if (date_to) where.createdAt.$lte = new Date(date_to);
      }

      // If warehouse_id is provided, we need to filter by locations in that warehouse
      let locationIds = null;
      if (warehouse_id) {
        const locations = await Location.find({ warehouseId: warehouse_id }).select('_id').lean();
        locationIds = locations.map(l => l._id);
        where.$or = [
          { fromLocationId: { $in: locationIds } },
          { toLocationId: { $in: locationIds } }
        ];
      }

      // Get documents with total count
      const [documents, total] = await Promise.all([
        Document.find(where)
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
          .populate('createdById', 'id name email')
          .populate('validatedById', 'id name email')
          .populate({
            path: 'stockMoves',
            populate: {
              path: 'productId',
              select: 'id name sku'
            }
          })
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 })
          .lean(),
        Document.countDocuments(where)
      ]);

      // Get stock moves for documents
      const docIds = documents.map(d => d._id);
      const stockMoves = await StockMove.find({ documentId: { $in: docIds } })
        .populate('productId', 'id name sku')
        .lean();

      // Map stock moves to documents
      const documentsWithMoves = documents.map(doc => {
        const moves = stockMoves.filter(sm => sm.documentId.toString() === doc._id.toString());
        return {
          ...doc,
          id: doc._id,
          stockMoves: moves.map(move => ({
            id: move._id,
            documentId: move.documentId,
            productId: move.productId?._id || move.productId,
            product: move.productId ? {
              id: move.productId._id || move.productId.id,
              name: move.productId.name,
              sku: move.productId.sku
            } : null,
            fromLocationId: move.fromLocationId,
            toLocationId: move.toLocationId,
            quantity: move.quantity,
            createdAt: move.createdAt,
            updatedAt: move.updatedAt
          })),
          fromLocation: doc.fromLocationId ? {
            id: doc.fromLocationId._id || doc.fromLocationId.id,
            name: doc.fromLocationId.name,
            warehouse: doc.fromLocationId.warehouseId ? {
              id: doc.fromLocationId.warehouseId._id || doc.fromLocationId.warehouseId.id,
              name: doc.fromLocationId.warehouseId.name,
              code: doc.fromLocationId.warehouseId.code
            } : null
          } : null,
          toLocation: doc.toLocationId ? {
            id: doc.toLocationId._id || doc.toLocationId.id,
            name: doc.toLocationId.name,
            warehouse: doc.toLocationId.warehouseId ? {
              id: doc.toLocationId.warehouseId._id || doc.toLocationId.warehouseId.id,
              name: doc.toLocationId.warehouseId.name,
              code: doc.toLocationId.warehouseId.code
            } : null
          } : null,
          createdBy: doc.createdById ? {
            id: doc.createdById._id || doc.createdById.id,
            name: doc.createdById.name,
            email: doc.createdById.email
          } : null,
          validatedBy: doc.validatedById ? {
            id: doc.validatedById._id || doc.validatedById.id,
            name: doc.validatedById.name,
            email: doc.validatedById.email
          } : null
        };
      });

      res.json({
        success: true,
        data: {
          documents: documentsWithMoves,
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

  async createDocument(req, res, next) {
    try {
      const {
        doc_type,
        status = 'DRAFT',
        from_location_id,
        to_location_id,
        supplier_name,
        customer_name,
        scheduled_date,
        lines
      } = req.body;

      // Generate document number
      const docCount = await Document.countDocuments({ docType: doc_type });
      const docNumber = `${doc_type.substring(0, 3)}-${(docCount + 1).toString().padStart(6, '0')}`;

      // Validate locations based on document type
      if (doc_type === 'RECEIPT') {
        if (!to_location_id) {
          return res.status(400).json({
            success: false,
            message: 'To location is required for receipts'
          });
        }
      } else if (doc_type === 'DELIVERY') {
        if (!from_location_id) {
          return res.status(400).json({
            success: false,
            message: 'From location is required for deliveries'
          });
        }
      } else if (doc_type === 'INTERNAL_TRANSFER') {
        if (!from_location_id || !to_location_id) {
          return res.status(400).json({
            success: false,
            message: 'Both from and to locations are required for internal transfers'
          });
        }
      }

      // Create document with stock moves in transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      let createdDocId;
      try {
        // Create document
        const newDoc = await Document.create([{
          docNumber,
          docType: doc_type,
          status,
          fromLocationId: from_location_id,
          toLocationId: to_location_id,
          supplierName: supplier_name,
          customerName: customer_name,
          scheduledDate: scheduled_date ? new Date(scheduled_date) : null,
          createdById: req.user.id
        }], { session });

        createdDocId = newDoc[0]._id;

        // Create stock moves
        const stockMovesData = lines.map(line => ({
          documentId: newDoc[0]._id,
          productId: line.product_id,
          fromLocationId: from_location_id,
          toLocationId: to_location_id,
          quantity: line.quantity
        }));

        await StockMove.insertMany(stockMovesData, { session });

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

      // Fetch complete document with relations (outside transaction)
      const completeDocument = await Document.findById(createdDocId)
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
        .populate('createdById', 'id name email')
        .populate({
          path: 'stockMoves',
          populate: {
            path: 'productId',
            select: 'id name sku'
          }
        })
        .lean();

      const stockMoves = await StockMove.find({ documentId: createdDocId })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...completeDocument,
        id: completeDocument._id,
        stockMoves: stockMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async getDocument(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id)
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
        .populate('createdById', 'id name email')
        .populate('validatedById', 'id name email')
        .lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get stock moves
      const stockMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku unitOfMeasure')
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
        .lean();

      const docResponse = {
        ...document,
        id: document._id,
        stockMoves: stockMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku,
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
        }))
      };

      res.json({
        success: true,
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async validateDocument(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.status === 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Document is already validated'
        });
      }

      if (document.status === 'CANCELED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot validate a canceled document'
        });
      }

      // Get stock moves
      const stockMoves = await StockMove.find({ documentId: id }).lean();

      // Validate document and update stock in transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update stock quantities based on document type
        for (const move of stockMoves) {
          if (document.docType === 'RECEIPT') {
            // Increase stock at to_location
            await documentsController.updateStockQuant(session, move.productId, move.toLocationId, move.quantity, 'INCREASE');
          } else if (document.docType === 'DELIVERY') {
            // Decrease stock at from_location
            await documentsController.updateStockQuant(session, move.productId, move.fromLocationId, move.quantity, 'DECREASE');
          } else if (document.docType === 'INTERNAL_TRANSFER') {
            // Decrease from source, increase at destination
            await documentsController.updateStockQuant(session, move.productId, move.fromLocationId, move.quantity, 'DECREASE');
            await documentsController.updateStockQuant(session, move.productId, move.toLocationId, move.quantity, 'INCREASE');
          } else if (document.docType === 'ADJUSTMENT') {
            // For adjustment, we need to calculate the difference
            const currentQuant = await StockQuant.findOne({
              productId: move.productId,
              locationId: move.toLocationId
            }).session(session).lean();

            const currentQty = currentQuant ? currentQuant.quantity : 0;
            const difference = move.quantity - currentQty;

            if (difference > 0) {
              await documentsController.updateStockQuant(session, move.productId, move.toLocationId, difference, 'INCREASE');
            } else if (difference < 0) {
              await documentsController.updateStockQuant(session, move.productId, move.toLocationId, Math.abs(difference), 'DECREASE');
            }
          }
        }

        // Update document status
        await Document.findByIdAndUpdate(
          id,
          {
            $set: {
              status: 'DONE',
              validatedById: req.user.id,
              validatedAt: new Date()
            }
          },
          { session, new: true }
        );

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

      // Fetch updated document
      const updatedDocument = await Document.findById(id)
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
        .populate('createdById', 'id name email')
        .populate('validatedById', 'id name email')
        .populate({
          path: 'stockMoves',
          populate: {
            path: 'productId',
            select: 'id name sku'
          }
        })
        .lean();

      const updatedMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...updatedDocument,
        id: updatedDocument._id,
        stockMoves: updatedMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.json({
        success: true,
        message: 'Document validated successfully',
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelDocument(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.status === 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a validated document'
        });
      }

      if (document.status === 'CANCELED') {
        return res.status(400).json({
          success: false,
          message: 'Document is already canceled'
        });
      }

      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        { $set: { status: 'CANCELED' } },
        { new: true }
      )
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
        .populate('createdById', 'id name email')
        .lean();

      const stockMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...updatedDocument.toObject(),
        id: updatedDocument._id,
        stockMoves: stockMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.json({
        success: true,
        message: 'Document canceled successfully',
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDocumentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Prevent changing status of validated documents
      if (document.status === 'DONE' && status !== 'CANCELED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change status of validated documents'
        });
      }

      // Prevent changing status of canceled documents back to active statuses
      if (document.status === 'CANCELED' && status !== 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change status of canceled documents'
        });
      }

      // Handle validation logic
      if (status === 'DONE') {
        // Validate document and update stock
        return await documentsController.validateDocumentLogic(req, res, next, id);
      }

      // Handle cancellation logic
      if (status === 'CANCELED') {
        // Cancel document
        return await documentsController.cancelDocumentLogic(req, res, next, id);
      }

      // For other status changes, just update the status
      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      )
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
        .populate('createdById', 'id name email')
        .populate('validatedById', 'id name email')
        .lean();

      const stockMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...updatedDocument,
        id: updatedDocument._id,
        stockMoves: stockMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.json({
        success: true,
        message: `Document status updated to ${status}`,
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStockQuant(session, productId, locationId, quantity, operation) {
    const existingQuant = await StockQuant.findOne({
      productId,
      locationId
    }).session(session);

    if (existingQuant) {
      const newQuantity = operation === 'INCREASE' 
        ? existingQuant.quantity + quantity
        : existingQuant.quantity - quantity;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for product ${productId} at location ${locationId}`);
      }

      existingQuant.quantity = newQuantity;
      await existingQuant.save({ session });
      return existingQuant;
    } else {
      if (operation === 'DECREASE') {
        throw new Error(`Cannot decrease stock: no existing quantity for product ${productId} at location ${locationId}`);
      }

      const newQuant = await StockQuant.create([{
        productId,
        locationId,
        quantity
      }], { session });
      return newQuant[0];
    }
  },

  async createStockAdjustment(req, res, next) {
    try {
      const { product_id, location_id, counted_quantity } = req.body;

      if (!mongoose.Types.ObjectId.isValid(product_id) || !mongoose.Types.ObjectId.isValid(location_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product or location ID'
        });
      }

      // Get current quantity
      const currentQuant = await StockQuant.findOne({
        productId: product_id,
        locationId: location_id
      }).lean();

      const currentQty = currentQuant ? currentQuant.quantity : 0;
      const difference = counted_quantity - currentQty;

      if (difference === 0) {
        return res.status(400).json({
          success: false,
          message: 'No adjustment needed - counted quantity matches current quantity'
        });
      }

      // Get the location to find its warehouse
      const location = await Location.findById(location_id).lean();
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Get adjustment location in the same warehouse
      const adjustmentLocation = await Location.findOne({
        locationType: 'ADJUSTMENT',
        warehouseId: location.warehouseId
      }).lean();

      if (!adjustmentLocation) {
        return res.status(404).json({
          success: false,
          message: 'Adjustment location not found for this warehouse'
        });
      }

      // Create adjustment document
      const docCount = await Document.countDocuments({ docType: 'ADJUSTMENT' });
      const docNumber = `ADJ-${(docCount + 1).toString().padStart(6, '0')}`;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create adjustment document
        const adjustmentDoc = await Document.create([{
          docNumber,
          docType: 'ADJUSTMENT',
          status: 'DONE', // Auto-validate adjustments
          fromLocationId: difference > 0 ? adjustmentLocation._id : location_id,
          toLocationId: difference > 0 ? location_id : adjustmentLocation._id,
          createdById: req.user.id,
          validatedById: req.user.id,
          validatedAt: new Date()
        }], { session });

        // Create stock move
        await StockMove.create([{
          documentId: adjustmentDoc[0]._id,
          productId: product_id,
          fromLocationId: difference > 0 ? adjustmentLocation._id : location_id,
          toLocationId: difference > 0 ? location_id : adjustmentLocation._id,
          quantity: Math.abs(difference)
        }], { session });

        // Update stock quant
        if (currentQuant) {
          await StockQuant.updateOne(
            {
              productId: product_id,
              locationId: location_id
            },
            {
              $set: { quantity: counted_quantity }
            },
            { session }
          );
        } else {
          await StockQuant.create([{
            productId: product_id,
            locationId: location_id,
            quantity: counted_quantity
          }], { session });
        }

        await session.commitTransaction();
        session.endSession();

        const document = await Document.findById(adjustmentDoc[0]._id).lean();

        res.status(201).json({
          success: true,
          message: 'Stock adjustment completed successfully',
          data: { document }
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Prevent deletion of validated documents
      if (document.status === 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete validated documents. Stock has already been updated.'
        });
      }

      // Delete stock moves first
      await StockMove.deleteMany({ documentId: id });

      // Delete document
      await Document.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async validateDocumentLogic(req, res, next, documentId) {
    try {
      const id = documentId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.status === 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Document is already validated'
        });
      }

      if (document.status === 'CANCELED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot validate a canceled document'
        });
      }

      // Get stock moves
      const stockMoves = await StockMove.find({ documentId: id }).lean();

      // Validate document and update stock in transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update stock quantities based on document type
        for (const move of stockMoves) {
          if (document.docType === 'RECEIPT') {
            // Increase stock at to_location
            await documentsController.updateStockQuant(session, move.productId, move.toLocationId, move.quantity, 'INCREASE');
          } else if (document.docType === 'DELIVERY') {
            // Decrease stock at from_location
            await documentsController.updateStockQuant(session, move.productId, move.fromLocationId, move.quantity, 'DECREASE');
          } else if (document.docType === 'INTERNAL_TRANSFER') {
            // Decrease from source, increase at destination
            await documentsController.updateStockQuant(session, move.productId, move.fromLocationId, move.quantity, 'DECREASE');
            await documentsController.updateStockQuant(session, move.productId, move.toLocationId, move.quantity, 'INCREASE');
          } else if (document.docType === 'ADJUSTMENT') {
            // For adjustment, we need to calculate the difference
            const currentQuant = await StockQuant.findOne({
              productId: move.productId,
              locationId: move.toLocationId
            }).session(session).lean();

            const currentQty = currentQuant ? currentQuant.quantity : 0;
            const difference = move.quantity - currentQty;

            if (difference > 0) {
              await documentsController.updateStockQuant(session, move.productId, move.toLocationId, difference, 'INCREASE');
            } else if (difference < 0) {
              await documentsController.updateStockQuant(session, move.productId, move.toLocationId, Math.abs(difference), 'DECREASE');
            }
          }
        }

        // Update document status
        await Document.findByIdAndUpdate(
          id,
          {
            $set: {
              status: 'DONE',
              validatedById: req.user.id,
              validatedAt: new Date()
            }
          },
          { session, new: true }
        );

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

      // Fetch updated document
      const updatedDocument = await Document.findById(id)
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
        .populate('createdById', 'id name email')
        .populate('validatedById', 'id name email')
        .populate({
          path: 'stockMoves',
          populate: {
            path: 'productId',
            select: 'id name sku'
          }
        })
        .lean();

      const updatedMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...updatedDocument,
        id: updatedDocument._id,
        stockMoves: updatedMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.json({
        success: true,
        message: 'Document validated successfully',
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelDocumentLogic(req, res, next, documentId) {
    try {
      const id = documentId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      const document = await Document.findById(id).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.status === 'DONE') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a validated document'
        });
      }

      if (document.status === 'CANCELED') {
        return res.status(400).json({
          success: false,
          message: 'Document is already canceled'
        });
      }

      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        { $set: { status: 'CANCELED' } },
        { new: true }
      )
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
        .populate('createdById', 'id name email')
        .lean();

      const stockMoves = await StockMove.find({ documentId: id })
        .populate('productId', 'id name sku')
        .lean();

      const docResponse = {
        ...updatedDocument.toObject(),
        id: updatedDocument._id,
        stockMoves: stockMoves.map(move => ({
          id: move._id,
          documentId: move.documentId,
          productId: move.productId?._id || move.productId,
          product: move.productId ? {
            id: move.productId._id || move.productId.id,
            name: move.productId.name,
            sku: move.productId.sku
          } : null,
          fromLocationId: move.fromLocationId,
          toLocationId: move.toLocationId,
          quantity: move.quantity
        }))
      };

      res.json({
        success: true,
        message: 'Document canceled successfully',
        data: { document: docResponse }
      });
    } catch (error) {
      next(error);
    }
  },
};

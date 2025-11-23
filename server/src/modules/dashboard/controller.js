// src/modules/dashboard/controller.js
import mongoose from 'mongoose';
import { StockQuant, Product, ReorderRule, Document } from '../../models/index.js';

export const dashboardController = {
  async getSummary(req, res, next) {
    try {
      // Total products in stock (distinct products with quantity > 0)
      const totalProductsInStock = await StockQuant.distinct('productId', {
        quantity: { $gt: 0 }
      }).then(results => results.length);

      // Low stock and out of stock items
      const productsWithStock = await Product.find({ isActive: true })
        .populate('categoryId', 'id name')
        .lean();

      const productIds = productsWithStock.map(p => p._id);
      
      // Get reorder rules
      const reorderRules = await ReorderRule.find({ 
        productId: { $in: productIds } 
      }).lean();

      // Get stock quants
      const stockQuants = await StockQuant.find({ 
        productId: { $in: productIds } 
      }).lean();

      let lowStockCount = 0;
      let outOfStockCount = 0;

      productsWithStock.forEach(product => {
        const productStockQuants = stockQuants.filter(
          sq => sq.productId.toString() === product._id.toString()
        );
        const totalQty = productStockQuants.reduce(
          (sum, quant) => sum + quant.quantity, 0
        );
        
        const productReorderRule = reorderRules.find(
          rr => rr.productId.toString() === product._id.toString()
        );

        if (totalQty === 0) {
          outOfStockCount++;
        } else if (productReorderRule && totalQty < productReorderRule.minQty) {
          lowStockCount++;
        }
      });

      // Pending receipts
      const pendingReceiptsCount = await Document.countDocuments({
        docType: 'RECEIPT',
        status: { $in: ['DRAFT', 'WAITING', 'READY'] }
      });

      // Pending deliveries
      const pendingDeliveriesCount = await Document.countDocuments({
        docType: 'DELIVERY',
        status: { $in: ['DRAFT', 'WAITING', 'READY'] }
      });

      // Internal transfers scheduled
      const internalTransfersScheduledCount = await Document.countDocuments({
        docType: 'INTERNAL_TRANSFER',
        status: { $nin: ['DONE', 'CANCELED'] }
      });

      res.json({
        success: true,
        data: {
          total_products_in_stock: totalProductsInStock,
          low_stock_items_count: lowStockCount,
          out_of_stock_items_count: outOfStockCount,
          pending_receipts_count: pendingReceiptsCount,
          pending_deliveries_count: pendingDeliveriesCount,
          internal_transfers_scheduled_count: internalTransfersScheduledCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getLowStockItems(req, res, next) {
    try {
      const products = await Product.find({ isActive: true })
        .populate('categoryId', 'id name')
        .lean();

      const productIds = products.map(p => p._id);

      // Get reorder rules
      const reorderRules = await ReorderRule.find({ 
        productId: { $in: productIds } 
      }).lean();

      // Get stock quants
      const stockQuants = await StockQuant.find({ 
        productId: { $in: productIds } 
      }).lean();

      const lowStockItems = products
        .map(product => {
          const productStockQuants = stockQuants.filter(
            sq => sq.productId.toString() === product._id.toString()
          );
          const totalQty = productStockQuants.reduce(
            (sum, quant) => sum + quant.quantity, 0
          );
          
          const productReorderRule = reorderRules.find(
            rr => rr.productId.toString() === product._id.toString()
          );

          return {
            product_id: product._id,
            sku: product.sku,
            name: product.name,
            category: product.categoryId ? {
              id: product.categoryId._id || product.categoryId.id,
              name: product.categoryId.name
            } : null,
            total_qty: totalQty,
            min_qty: productReorderRule?.minQty || 0,
            has_reorder_rule: !!productReorderRule
          };
        })
        .filter(item => 
          item.has_reorder_rule && item.total_qty < item.min_qty
        )
        .sort((a, b) => a.total_qty - b.total_qty);

      res.json({
        success: true,
        data: { low_stock_items: lowStockItems }
      });
    } catch (error) {
      next(error);
    }
  }
};

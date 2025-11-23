import mongoose from 'mongoose';

const stockMoveSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  fromLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  toLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
stockMoveSchema.index({ documentId: 1 });
stockMoveSchema.index({ productId: 1 });
stockMoveSchema.index({ fromLocationId: 1 });
stockMoveSchema.index({ toLocationId: 1 });
stockMoveSchema.index({ createdAt: -1 });

const StockMove = mongoose.model('StockMove', stockMoveSchema);

export default StockMove;


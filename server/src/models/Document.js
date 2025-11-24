import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  docNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  docType: {
    type: String,
    enum: ['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'],
    default: 'DRAFT'
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
  supplierName: {
    type: String,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validatedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  validatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock moves
documentSchema.virtual('stockMoves', {
  ref: 'StockMove',
  localField: '_id',
  foreignField: 'documentId'
});

// Indexes for faster queries (docNumber already has unique index from unique: true)
documentSchema.index({ docType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ fromLocationId: 1 });
documentSchema.index({ toLocationId: 1 });
documentSchema.index({ createdById: 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;


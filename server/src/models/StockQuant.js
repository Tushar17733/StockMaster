import mongoose from 'mongoose';

const stockQuantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index for product-location combination
stockQuantSchema.index({ productId: 1, locationId: 1 }, { unique: true });
stockQuantSchema.index({ productId: 1 });
stockQuantSchema.index({ locationId: 1 });

const StockQuant = mongoose.model('StockQuant', stockQuantSchema);

export default StockQuant;


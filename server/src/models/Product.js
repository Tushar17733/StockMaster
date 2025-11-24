import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  unitOfMeasure: {
    type: String,
    required: false,
    default: 'pcs',
    trim: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries (sku already has unique index from unique: true)
productSchema.index({ categoryId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', sku: 'text' }); // Text search index

const Product = mongoose.model('Product', productSchema);

export default Product;


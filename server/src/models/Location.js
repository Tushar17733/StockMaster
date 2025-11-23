import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  locationType: {
    type: String,
    enum: ['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'ADJUSTMENT'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique location per warehouse
locationSchema.index({ warehouseId: 1, name: 1 }, { unique: true });
locationSchema.index({ warehouseId: 1 });
locationSchema.index({ locationType: 1 });

const Location = mongoose.model('Location', locationSchema);

export default Location;


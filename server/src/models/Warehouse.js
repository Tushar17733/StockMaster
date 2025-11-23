import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
warehouseSchema.index({ name: 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse;


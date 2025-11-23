import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'],
    default: 'WAREHOUSE_STAFF'
  },
  defaultWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries (email already has unique index from unique: true)
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;


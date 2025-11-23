import mongoose from 'mongoose';

const reorderRuleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  minQty: {
    type: Number,
    required: true,
    min: 0
  },
  preferredQty: {
    type: Number,
    min: 0,
    default: null
  }
}, {
  timestamps: true
});

// No need for explicit index - productId already has unique index from unique: true

const ReorderRule = mongoose.model('ReorderRule', reorderRuleSchema);

export default ReorderRule;


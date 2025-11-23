import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// No need for explicit index - name already has unique index from unique: true

const Category = mongoose.model('Category', categorySchema);

export default Category;


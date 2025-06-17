const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seedId: {
    type: String,
    unique: true,
    sparse: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true,
    default: '0'
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  hoverImage: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  }
}, {
  timestamps: true 
});

productSchema.index({ seedId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);
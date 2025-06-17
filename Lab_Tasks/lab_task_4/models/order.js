const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: String,
      required: true
    },
    itemTotal: {
      type: String,
      required: true
    }
  }],
  totalAmount: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

orderSchema.virtual('orderNumber').get(function() {
  return 'ORD-' + this._id.toString().slice(-8).toUpperCase();
});

orderSchema.virtual('formattedOrderDate').get(function() {
  return this.orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

orderSchema.statics.findByStatus = function(status) {
  return this.find({ status: status });
};

orderSchema.statics.findByUserId = function(userId) {
  return this.find({ userId: userId }).sort({ orderDate: -1 });
};


orderSchema.statics.findByUserEmail = function(email) {
  return this.find({ customerEmail: email.toLowerCase() }).sort({ orderDate: -1 });
};

orderSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

orderSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveryDate = new Date();
  return this.save();
};

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
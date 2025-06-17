const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');

async function getCartWithProducts(req) {
  const cartItems = [];
  let total = 0;

  for (const item of req.session.cart) {
    const product = await Product.findById(item.productId);
    if (product) {
      const itemTotal = parseFloat(product.price) * item.quantity;
      cartItems.push({
        product: product,
        quantity: item.quantity,
        itemTotal: itemTotal.toFixed(2)
      });
      total += itemTotal;
    }
  }

  return {
    items: cartItems,
    total: total.toFixed(2),
    itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
  };
}

function clearCart(req) {
  req.session.cart = [];
}

router.get('/checkout', async (req, res) => {
  try {

    if (!req.session.cart || req.session.cart.length === 0) {
      req.session.error = 'Your cart is empty! Please add some products first.';
      return res.redirect('/cart');
    }

    const cart = await getCartWithProducts(req);

    if (cart.items.length === 0) {
      req.session.error = 'Your cart contains invalid items. Please refresh your cart.';
      return res.redirect('/cart');
    }

    res.render('checkout', {
      title: 'Checkout - Missguided',
      cart: cart,
      error: req.session.error,
      message: req.session.message,
      formData: req.session.formData || {}
    });

    delete req.session.error;
    delete req.session.message;
    delete req.session.formData;
  } catch (error) {
    console.error('Error loading checkout:', error);
    req.session.error = 'Error loading checkout page. Please try again.';
    res.redirect('/cart');
  }
});

router.post('/place', async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      address, 
      email, 
      notes,
      title,
      firstName,
      lastName,
      countryCode,
      city,
      postcode,
      country
    } = req.body;

    const fullName = name || `${firstName} ${lastName}`.trim();
    
    if (!fullName || !phone || !address) {
      req.session.error = 'Please fill in all required fields (Name, Phone, Address)';
      req.session.formData = req.body; 
      return res.redirect('/orders/checkout');
    }

    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      req.session.error = 'Please enter a valid phone number';
      req.session.formData = req.body;
      return res.redirect('/orders/checkout');
    }

    if (!req.session.cart || req.session.cart.length === 0) {
      req.session.error = 'Your cart is empty!';
      return res.redirect('/cart');
    }

    const cart = await getCartWithProducts(req);
    
    if (cart.items.length === 0) {
      req.session.error = 'Your cart contains invalid items';
      return res.redirect('/cart');
    }

    const orderData = {
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      customerEmail: email ? email.trim() : undefined,
      items: cart.items.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal: item.itemTotal
      })),
      totalAmount: cart.total,
      status: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      notes: notes ? notes.trim() : undefined,
      orderDate: new Date()
    };

    const order = new Order(orderData);
    await order.save();
    
    console.log('Order placed successfully:', order._id);

    clearCart(req);

    req.session.message = 'Order placed successfully! Thank you for your purchase. We will contact you soon for confirmation.';

    res.redirect('/');
    
  } catch (error) {
    console.error('Error placing order:', error);
    req.session.error = 'Error placing order. Please try again.';
    req.session.formData = req.body; 
    res.redirect('/orders/checkout');
  }
});


router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).render('404', { 
        title: 'Order Not Found - Missguided',
        message: 'The order you are looking for does not exist.'
      });
    }

    res.render('order-detail', {
      title: `Order ${order.orderNumber} - Missguided`,
      order: order
    });
  } catch (error) {
    console.error('Error loading order:', error);
    res.status(500).render('500', { 
      title: 'Server Error - Missguided',
      message: 'Error loading order details'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('orders', {
      title: 'Orders - Missguided',
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    res.render('orders', {
      title: 'Orders - Missguided',
      orders: [],
      error: 'Error loading orders',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Product = require('../models/product'); 
const Order = require('../models/order'); 
const { getCartWithProducts } = require('./cart'); 

const getCartFromSession = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  return await getCartWithProducts(req);
};

function clearCart(req) {
  req.session.cart = [];
}

router.get('/', async (req, res) => {
  try {
    let cart = await getCartFromSession(req);
    
    console.log('Cart data in checkout:', JSON.stringify(cart, null, 2)); 
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.render('checkout', { 
        layout: false,
        cart: null,
        formData: null,
        message: null,
        error: null
      });
    }
    res.render('checkout', { 
      layout: false,
      cart: cart,
      formData: req.session?.checkoutFormData || null,
      message: req.flash ? req.flash('success') : null,
      error: req.flash ? req.flash('error') : null
    });
  } catch (error) {
    console.error('Checkout page error:', error);
    res.status(500).render('checkout', { 
      layout: false,
      cart: null,
      formData: null,
      message: null,
      error: 'An error occurred while loading the checkout page'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      firstName,
      lastName,
      name,
      countryCode,
      phone,
      email,
      address,
      address2,
      city,
      postcode,
      country,
      notes,
      paymentMethod
    } = req.body;

    let cart = await getCartFromSession(req);
    const errors = [];
    
    // Validation
    if (!title) errors.push('Title is required');
    if (!firstName || !/^[A-Za-z\s]+$/.test(firstName)) {
      errors.push('Valid first name is required (letters only)');
    }
    if (!lastName || !/^[A-Za-z\s]+$/.test(lastName)) {
      errors.push('Valid last name is required (letters only)');
    }
    if (!phone || !/^[0-9]{10,15}$/.test(phone)) {
      errors.push('Valid phone number is required (10-15 digits)');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address is required');
    }
    if (!address) errors.push('Address is required');
    if (!city) errors.push('City is required');
    if (!postcode) errors.push('Postcode is required');
    if (!country) errors.push('Country is required');
    if (!cart || !cart.items || cart.items.length === 0) {
      errors.push('Your cart is empty');
    }

    if (errors.length > 0) {
      req.session.checkoutFormData = req.body;
      
      return res.render('checkout', {
        layout: false,
        cart: cart,
        formData: req.body,
        message: null,
        error: errors.join(', ')
      });
    }

    const fullName = `${title} ${firstName} ${lastName}`.trim();
    const fullAddress = address2 ? `${address}, ${address2}` : address;
    const fullAddressWithCity = `${fullAddress}, ${city}, ${postcode}, ${country}`;

    const orderData = {
      customerName: fullName,
      customerPhone: `${countryCode || ''}${phone}`.trim(),
      customerAddress: fullAddressWithCity,
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
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      notes: notes ? notes.trim() : undefined,
      orderDate: new Date()
    };

    const order = new Order(orderData);
    await order.save();
    
    console.log('Order placed successfully:', order._id);

    clearCart(req);
    delete req.session.checkoutFormData;

    req.session.message = 'Order placed successfully! Thank you for your purchase. We will contact you soon for confirmation.';

    res.redirect('/');
    
  } catch (error) {
    console.error('Checkout form error:', error);
    
    let cart = await getCartFromSession(req);
    
    res.render('checkout', {
      layout: false,
      cart: cart,
      formData: req.body,
      message: null,
      error: 'An error occurred while processing your request'
    });
  }
});

module.exports = router;
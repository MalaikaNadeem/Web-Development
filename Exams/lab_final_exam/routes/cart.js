const express = require('express');
const router = express.Router();
const Product = require('../models/product');

function addToCart(req, productId, quantity = 1) {
  const existingItem = req.session.cart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    req.session.cart.push({
      productId: productId,
      quantity: quantity
    });
  }
}

function removeFromCart(req, productId) {
  req.session.cart = req.session.cart.filter(item => item.productId !== productId);
}

function updateCartQuantity(req, productId, quantity) {
  const item = req.session.cart.find(item => item.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(req, productId);
    } else {
      item.quantity = quantity;
    }
  }
}

function clearCart(req) {
  req.session.cart = [];
}

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
    itemCount: cartItems.length
  };
}

router.get('/', async (req, res) => {
  try {
    const cart = await getCartWithProducts(req);
    res.render('cart', {
      title: 'Shopping Cart - Missguided',
      cart: cart,
      message: req.session.message,
      error: req.session.error
    });
    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading cart:', error);
    res.render('cart', {
      title: 'Shopping Cart - Missguided',
      cart: { items: [], total: '0.00', itemCount: 0 },
      error: 'Error loading cart'
    });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    addToCart(req, productId, parseInt(quantity) || 1);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
      res.json({ 
        success: true, 
        message: `${product.name} added to cart`,
        cartCount: cartCount
      });
    } else {
      req.session.message = `${product.name} added to cart successfully!`;
      res.redirect('/cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Server error' });
    } else {
      req.session.error = 'Error adding product to cart';
      res.redirect('back');
    }
  }
});

router.post('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    updateCartQuantity(req, productId, parseInt(quantity));
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const cart = await getCartWithProducts(req);
      res.json({ 
        success: true, 
        message: 'Cart updated',
        cart: cart
      });
    } else {
      req.session.message = 'Cart updated successfully!';
      res.redirect('/cart');
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Server error' });
    } else {
      req.session.error = 'Error updating cart';
      res.redirect('/cart');
    }
  }
});

router.post('/remove', (req, res) => {
  try {
    const { productId } = req.body;
    removeFromCart(req, productId);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, message: 'Item removed from cart' });
    } else {
      req.session.message = 'Item removed from cart!';
      res.redirect('/cart');
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Server error' });
    } else {
      req.session.error = 'Error removing item from cart';
      res.redirect('/cart');
    }
  }
});

router.post('/clear', (req, res) => {
  try {
    clearCart(req);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, message: 'Cart cleared' });
    } else {
      req.session.message = 'Cart cleared successfully!';
      res.redirect('/cart');
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Server error' });
    } else {
      req.session.error = 'Error clearing cart';
      res.redirect('/cart');
    }
  }
});

module.exports = {
  router,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartWithProducts
};
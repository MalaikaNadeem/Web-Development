const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('products/index', { 
      title: 'Products - Missguided',
      products: products
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.render('products/index', { 
      title: 'Products - Missguided',
      products: [],
      error: 'Error loading products'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let product;
    
    if (req.params.id.startsWith('p')) {
      product = await Product.findOne({ seedId: req.params.id });
    }
    
    if (!product) {
      product = await Product.findById(req.params.id);
    }
    
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found - Missguided' });
    }
    
    res.render('products/detail', {
      title: `${product.name} - Missguided`,
      product: product
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).render('500', { title: 'Server Error - Missguided' });
  }
});

module.exports = router;
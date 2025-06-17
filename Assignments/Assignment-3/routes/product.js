const express = require('express');
const router = express.Router();

router.get('/products', (req, res) => {
  const category = req.query.category;
  let allProducts = req.app.locals.products || [];
  let filteredProducts = allProducts;

  console.log('All products:', allProducts.length);
  console.log('Category filter:', category);

  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }

  console.log('Filtered products:', filteredProducts.length);

  res.render('products', {
    title: 'All Products - Missguided',
    products: filteredProducts,
    selectedCategory: category || null
  });
});

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Shop the latest trends at Missguided',
    products: req.app.locals.products.slice(0, 10),
    carouselImages: [
      'missguidedimg1.webp',
      'missguidedimg2.webp'
      ]
  });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us - Missguided' });
});

module.exports = router;
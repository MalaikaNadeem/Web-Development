const express = require('express');
const router = express.Router();

router.get('/checkout', (req, res) => {
  res.render('checkout', { layout: false });
});

module.exports = router;
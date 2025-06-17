const express = require('express');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (req.session?.userId) return next();
  return res.redirect('/login');
};

router.get('/profile', requireAuth, (req, res) => {
  const user = req.app.locals.users.find(u => u.id === req.session.userId);
  res.render('profile', { title: 'My Profile - Missguided', user });
});

module.exports = router;
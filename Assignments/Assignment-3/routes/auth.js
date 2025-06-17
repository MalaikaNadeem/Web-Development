const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { title: 'Login - Missguided', layout: 'layouts/auth', error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = req.app.locals.users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('auth/login', { title: 'Login - Missguided', layout: 'layouts/auth', error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  res.redirect('/');
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { title: 'Register - Missguided', layout: 'layouts/auth', error: null });
});

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  const users = req.app.locals.users;

  if (!firstName || !lastName || !email || !password || password !== confirmPassword) {
    return res.render('auth/register', { title: 'Register - Missguided', layout: 'layouts/auth', error: 'Invalid input or passwords do not match' });
  }

  if (users.find(u => u.email === email)) {
    return res.render('auth/register', { title: 'Register - Missguided', layout: 'layouts/auth', error: 'User with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, firstName, lastName, email, password: hashedPassword, createdAt: new Date() };

  users.push(newUser);
  req.session.userId = newUser.id;
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

module.exports = router;

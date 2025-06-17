const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/login', (req, res) => {
  try {
    console.log('Login route accessed');
    console.log('Session userId:', req.session.userId);
    
    if (req.session.userId) return res.redirect('/');
    
    console.log('Rendering login page...');
    res.render('auth/login', { 
      title: 'Login - Missguided', 
      layout: 'layouts/auth', 
      error: null 
    });
  } catch (error) {
    console.error('Error in login GET route:', error);
    res.status(500).send('Error loading login page: ' + error.message);
  }
});

router.get('/register', (req, res) => {
  try {
    console.log('Register route accessed');
    console.log('Session userId:', req.session.userId);
    
    if (req.session.userId) return res.redirect('/');
    
    console.log('Rendering register page...');
    res.render('auth/register', { 
      title: 'Register - Missguided', 
      layout: 'layouts/auth', 
      error: null 
    });
  } catch (error) {
    console.error('Error in register GET route:', error);
    res.status(500).send('Error loading register page: ' + error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login POST route accessed');
    console.log('Request body:', req.body);
    console.log('Available users:', req.app.locals.users);
    
    const { email, password } = req.body;
    const user = req.app.locals.users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('auth/login', { 
        title: 'Login - Missguided', 
        layout: 'layouts/auth', 
        error: 'Invalid email or password' 
      });
    }

    req.session.userId = user.id;
    req.session.username = `${user.firstName} ${user.lastName}`;
    res.redirect('/');
  } catch (error) {
    console.error('Error in login POST route:', error);
    res.status(500).send('Login error: ' + error.message);
  }
});

router.post('/register', async (req, res) => {
  try {
    console.log('Register POST route accessed');
    console.log('Request body:', req.body);
    
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    const users = req.app.locals.users;

    if (!firstName || !lastName || !email || !password || password !== confirmPassword) {
      return res.render('auth/register', { 
        title: 'Register - Missguided', 
        layout: 'layouts/auth', 
        error: 'Invalid input or passwords do not match' 
      });
    }

    if (users.find(u => u.email === email)) {
      return res.render('auth/register', { 
        title: 'Register - Missguided', 
        layout: 'layouts/auth', 
        error: 'User with this email already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
      id: users.length + 1, 
      firstName, 
      lastName, 
      email, 
      password: hashedPassword, 
      createdAt: new Date() 
    };

    users.push(newUser);
    req.session.userId = newUser.id;
    req.session.username = `${newUser.firstName} ${newUser.lastName}`;
    res.redirect('/');
  } catch (error) {
    console.error('Error in register POST route:', error);
    res.status(500).send('Registration error: ' + error.message);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

module.exports = router;
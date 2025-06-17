const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); 
const router = express.Router();

router.get('/login', (req, res) => {
  try {
    console.log('Login route accessed');
    console.log('Session userId:', req.session.userId);

    if (req.session.userId) {
      return res.redirect('/');
    }
    
    console.log('Rendering login page...');
    res.render('auth/login', { 
      title: 'Login - Missguided', 
      layout: 'layouts/auth', 
      error: req.session.error || null 
    });

    delete req.session.error;
  } catch (error) {
    console.error('Error in login GET route:', error);
    res.status(500).send('Error loading login page: ' + error.message);
  }
});

router.get('/register', (req, res) => {
  try {
    console.log('Register route accessed');
    console.log('Session userId:', req.session.userId);

    if (req.session.userId) {
      return res.redirect('/');
    }
    
    console.log('Rendering register page...');
    res.render('auth/register', { 
      title: 'Register - Missguided', 
      layout: 'layouts/auth', 
      error: req.session.error || null 
    });

    delete req.session.error;
  } catch (error) {
    console.error('Error in register GET route:', error);
    res.status(500).send('Error loading register page: ' + error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login POST route accessed');
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.error = 'Please provide both email and password';
      return res.redirect('/auth/login');
    }

    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    req.session.userId = user._id.toString();
    req.session.username = user.fullName;
    req.session.userEmail = user.email;
    
    console.log('Login successful for user:', user.email);
    console.log('Session userId set to:', req.session.userId);

    req.session.message = `Welcome back, ${user.firstName}!`;
    
    res.redirect('/');
  } catch (error) {
    console.error('Error in login POST route:', error);
    req.session.error = 'An error occurred during login. Please try again.';
    res.redirect('/auth/login');
  }
});

router.post('/register', async (req, res) => {
  try {
    console.log('Register POST route accessed');
    console.log('Request body:', req.body);
    
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      req.session.error = 'All fields are required';
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.session.error = 'Passwords do not match';
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.session.error = 'Password must be at least 6 characters long';
      return res.redirect('/auth/register');
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.session.error = 'User with this email already exists';
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    console.log('New user created:', savedUser.email);

    req.session.userId = savedUser._id.toString();
    req.session.username = savedUser.fullName;
    req.session.userEmail = savedUser.email;
    
    console.log('Registration successful for user:', savedUser.email);
    console.log('Session userId set to:', req.session.userId);
 
    req.session.message = `Welcome to Missguided, ${savedUser.firstName}! Your account has been created successfully.`;
    
    res.redirect('/');
  } catch (error) {
    console.error('Error in register POST route:', error);
    if (error.code === 11000) {

      req.session.error = 'User with this email already exists';
    } else {
      req.session.error = 'An error occurred during registration. Please try again.';
    }
    res.redirect('/auth/register');
  }
});

router.post('/logout', (req, res) => {
  try {
    console.log('Logout POST route accessed');
    console.log('Current session userId:', req.session.userId);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error logging out');
      }
      
      console.log('Session destroyed successfully');

      res.clearCookie('connect.sid'); 

      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error in logout POST route:', error);
    res.status(500).send('Logout error: ' + error.message);
  }
});

router.get('/logout', (req, res) => {
  try {
    console.log('Logout GET route accessed');
    console.log('Current session userId:', req.session.userId);

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error logging out');
      }
      
      console.log('Session destroyed successfully');

      res.clearCookie('connect.sid'); 
e
      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error in logout GET route:', error);
    res.status(500).send('Logout error: ' + error.message);
  }
});

module.exports = router;
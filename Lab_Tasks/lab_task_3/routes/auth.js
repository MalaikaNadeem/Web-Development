const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Import the User model
const router = express.Router();

// GET Login page
router.get('/login', (req, res) => {
  try {
    console.log('Login route accessed');
    console.log('Session userId:', req.session.userId);
    
    // If user is already logged in, redirect to home
    if (req.session.userId) {
      return res.redirect('/');
    }
    
    console.log('Rendering login page...');
    res.render('auth/login', { 
      title: 'Login - Missguided', 
      layout: 'layouts/auth', 
      error: req.session.error || null 
    });
    
    // Clear any session errors after displaying
    delete req.session.error;
  } catch (error) {
    console.error('Error in login GET route:', error);
    res.status(500).send('Error loading login page: ' + error.message);
  }
});

// GET Register page
router.get('/register', (req, res) => {
  try {
    console.log('Register route accessed');
    console.log('Session userId:', req.session.userId);
    
    // If user is already logged in, redirect to home
    if (req.session.userId) {
      return res.redirect('/');
    }
    
    console.log('Rendering register page...');
    res.render('auth/register', { 
      title: 'Register - Missguided', 
      layout: 'layouts/auth', 
      error: req.session.error || null 
    });
    
    // Clear any session errors after displaying
    delete req.session.error;
  } catch (error) {
    console.error('Error in register GET route:', error);
    res.status(500).send('Error loading register page: ' + error.message);
  }
});

// POST Login - Handle login form submission
router.post('/login', async (req, res) => {
  try {
    console.log('Login POST route accessed');
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      req.session.error = 'Please provide both email and password';
      return res.redirect('/auth/login');
    }

    // Find user in MongoDB using the User model
    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    // Compare password using the model method
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    // Store user information in session
    req.session.userId = user._id.toString();
    req.session.username = user.fullName;
    req.session.userEmail = user.email;
    
    console.log('Login successful for user:', user.email);
    console.log('Session userId set to:', req.session.userId);
    
    // Set success message
    req.session.message = `Welcome back, ${user.firstName}!`;
    
    res.redirect('/');
  } catch (error) {
    console.error('Error in login POST route:', error);
    req.session.error = 'An error occurred during login. Please try again.';
    res.redirect('/auth/login');
  }
});

// POST Register - Handle registration form submission
router.post('/register', async (req, res) => {
  try {
    console.log('Register POST route accessed');
    console.log('Request body:', req.body);
    
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validate input
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

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.session.error = 'User with this email already exists';
      return res.redirect('/auth/register');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user in MongoDB
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // Save user to database
    const savedUser = await newUser.save();
    console.log('New user created:', savedUser.email);

    // Store user information in session (auto-login after registration)
    req.session.userId = savedUser._id.toString();
    req.session.username = savedUser.fullName;
    req.session.userEmail = savedUser.email;
    
    console.log('Registration successful for user:', savedUser.email);
    console.log('Session userId set to:', req.session.userId);
    
    // Set success message
    req.session.message = `Welcome to Missguided, ${savedUser.firstName}! Your account has been created successfully.`;
    
    res.redirect('/');
  } catch (error) {
    console.error('Error in register POST route:', error);
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      req.session.error = 'User with this email already exists';
    } else {
      req.session.error = 'An error occurred during registration. Please try again.';
    }
    res.redirect('/auth/register');
  }
});

// POST Logout - Handle logout
router.post('/logout', (req, res) => {
  try {
    console.log('Logout POST route accessed');
    console.log('Current session userId:', req.session.userId);
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error logging out');
      }
      
      console.log('Session destroyed successfully');
      
      // Clear the session cookie
      res.clearCookie('connect.sid'); // Default session cookie name
      
      // Redirect to login page with a message
      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error in logout POST route:', error);
    res.status(500).send('Logout error: ' + error.message);
  }
});

// GET Logout - Alternative logout route (for GET requests)
router.get('/logout', (req, res) => {
  try {
    console.log('Logout GET route accessed');
    console.log('Current session userId:', req.session.userId);
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error logging out');
      }
      
      console.log('Session destroyed successfully');
      
      // Clear the session cookie
      res.clearCookie('connect.sid'); // Default session cookie name
      
      // Redirect to login page
      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error in logout GET route:', error);
    res.status(500).send('Logout error: ' + error.message);
  }
});

module.exports = router;
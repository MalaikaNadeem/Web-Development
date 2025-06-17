// middleware/auth.js
const requireAuth = (req, res, next) => {
  console.log('Auth middleware - checking session...');
  console.log('Session userId:', req.session.userId);
  
  // Check if user is logged in
  if (!req.session.userId) {
    console.log('User not authenticated, redirecting to login');
    req.session.error = 'Please log in to access this page';
    return res.redirect('/auth/login');
  }
  
  console.log('User authenticated, proceeding...');
  next();
};

// Optional: Middleware to redirect logged-in users away from auth pages
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    console.log('User already authenticated, redirecting to home');
    return res.redirect('/');
  }
  next();
};

// Optional: Middleware for admin-only routes (if needed in future)
const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    req.session.error = 'Please log in to access this page';
    return res.redirect('/auth/login');
  }
  
  // You can add admin role checking logic here
  // For now, we'll just check if user exists
  if (!req.session.userEmail) {
    req.session.error = 'Access denied';
    return res.redirect('/');
  }
  
  next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  requireAdmin
};
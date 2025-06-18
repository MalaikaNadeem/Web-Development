const requireAuth = (req, res, next) => {
  console.log('Auth middleware - checking session...');
  console.log('Session userId:', req.session.userId);

  if (!req.session.userId) {
    console.log('User not authenticated, redirecting to login');
    req.session.error = 'Please log in to access this page';
    return res.redirect('/auth/login');
  }
  
  console.log('User authenticated, proceeding...');
  next();
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    console.log('User already authenticated, redirecting to home');
    return res.redirect('/');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  console.log('Admin middleware - checking session...');
  console.log('Session userId:', req.session.userId);
  console.log('Session userEmail:', req.session.userEmail);

  if (!req.session.userId) {
    req.session.error = 'Please log in as admin to access this page';
    return res.redirect('/auth/login?admin=true');
  }

  if (!req.session.userEmail || req.session.userEmail !== 'malaikanadeem@gmail.com') {
    req.session.error = 'Access denied. Admin privileges required.';
    return res.redirect('/');
  }
  
  console.log('Admin authenticated, proceeding...');
  next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  requireAdmin
};
const User = require('../models/User');

/**
 * Middleware to check user role after Firebase auth.
 * Attaches req.dbUser (MongoDB User document) to the request.
 */
const attachDbUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let dbUser = await User.findOne({ firebaseUid: req.user.uid });

    if (!dbUser) {
      // Auto-create user doc on first authenticated request
      try {
        dbUser = await User.create({
          firebaseUid: req.user.uid,
          name: req.user.name || req.user.email?.split('@')[0] || 'User',
          email: req.user.email || '',
          provider: req.user.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
        });
      } catch (createError) {
        // If a duplicate key error occurs, it means another concurrent request created the user
        if (createError.code === 11000) {
          dbUser = await User.findOne({ firebaseUid: req.user.uid });
          if (!dbUser) {
            throw new Error('Failed to find user after duplicate key error');
          }
        } else {
          throw createError;
        }
      }
    }

    if (dbUser.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error attaching DB user:', error);
    return res.status(500).json({ message: 'Internal server error during user attachment', error: error.message });
  }
};

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin') or requireRole('faculty', 'admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = { attachDbUser, requireRole };

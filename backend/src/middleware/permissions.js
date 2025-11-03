// Permission Middleware
const { hasPermission, canAccessResource } = require('../config/permissions');

// Check if user has specific permission
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (hasPermission(userRole, requiredPermission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Insufficient permissions',
      required: requiredPermission,
      userRole: userRole
    });
  };
};

// Check if user can access resource with specific action
const checkResourceAccess = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (canAccessResource(userRole, resource, action)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      resource: resource,
      action: action,
      userRole: userRole
    });
  };
};

// Check if user is admin or super_admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
};

// Check if user is super_admin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  return res.status(403).json({ error: 'Super admin access required' });
};

module.exports = {
  checkPermission,
  checkResourceAccess,
  isAdmin,
  isSuperAdmin
};

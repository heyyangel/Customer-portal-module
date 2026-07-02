export const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Forbidden. No role assigned.' });
    }

    // Map flat roles to permissions
    const userPermissions = new Set();
    if (req.user.role === 'Admin') {
      userPermissions.add('*');
    } else if (req.user.role === 'Customer') {
      userPermissions.add('create_order');
    }

    const hasPermission = requiredPermissions.some(p => userPermissions.has(p));

    if (!hasPermission && !userPermissions.has('*')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. Insufficient permissions.' 
      });
    }

    next();
  };
};

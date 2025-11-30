// role-based access middleware
module.exports = function(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.length) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient role' });
    }
    next();
  };
};

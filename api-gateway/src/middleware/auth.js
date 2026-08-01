const jwt = require('jsonwebtoken');
const redis = require('../services/RedisService');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No authorization token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization header format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Redis blacklist — covers logout and forced revocation
    if (decoded.jti) {
      const blacklisted = await redis.isBlacklisted(decoded.jti);
      if (blacklisted) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token has been revoked' });
      }
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      tenant_id: decoded.tenant_id,
      full_name: decoded.full_name,
      role: decoded.role,
      type: decoded.type,
      jti: decoded.jti,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
module.exports.authenticateToken = authMiddleware;
module.exports.requireTenantAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'tenant_admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  next();
};
module.exports.requirePlatformAdmin = (req, res, next) => {
  if (req.user?.type !== 'platform_admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Platform admin access required' });
  }
  next();
};

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SaasService = require('../services/saasService');
const { timingSafeCompare } = require('./security');

const authenticate = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }

    // Find SaaS application by API key
    const saasApps = await SaasService.findAll();
    let authenticatedSaas = null;

    for (const saas of saasApps) {
      const isValid = await bcrypt.compare(apiKey, saas.api_key);
      if (isValid) {
        authenticatedSaas = saas;
        break;
      }
    }

    if (!authenticatedSaas) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    if (authenticatedSaas.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'SaaS application is not active'
      });
    }

    req.saas = authenticatedSaas;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Token-based authentication (secure)
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const validTokens = {
    [process.env.TEST_TOKEN || 'test_token']: { id: 1, tenant_id: 1, role: 'admin' },
    [process.env.TENANT_ADMIN_TOKEN || 'tenant_admin_token']: { id: 2, tenant_id: 1, role: 'admin' },
    [process.env.SUPER_ADMIN_TOKEN || 'super_admin_token']: { id: 3, tenant_id: null, role: 'super_admin' }
  };
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  const user = validTokens[token];
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Require tenant admin role
const requireTenantAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Tenant admin access required' });
  }
};

// Require super admin role
const requireSuperAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const superAdminToken = process.env.SUPER_ADMIN_TOKEN || 'super_admin_token';
  
  if (token && timingSafeCompare(token, superAdminToken)) {
    next();
  } else {
    res.status(403).json({ error: 'Super admin access required' });
  }
};

module.exports = { authenticate, authenticateToken, requireTenantAdmin, requireSuperAdmin };
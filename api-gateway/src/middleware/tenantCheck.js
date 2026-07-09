const tenantCheckMiddleware = (req, res, next) => {
  try {
    const tenantIdFromUrl = req.params.tenant_id;
    const userTenantId = req.user?.tenant_id;
    if (!tenantIdFromUrl) {
      return next();
    }
    if (tenantIdFromUrl !== userTenantId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this tenant' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant verification failed' });
  }
};

const validateTenant = (req, res, next) => {
  try {
    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Tenant information not found' });
    }
    req.tenant = { id: req.user.tenant_id };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant validation failed' });
  }
};

module.exports = tenantCheckMiddleware;
module.exports.validateTenant = validateTenant;

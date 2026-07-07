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

module.exports = tenantCheckMiddleware;

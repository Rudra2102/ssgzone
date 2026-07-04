const AuditService = require('../services/auditService');

const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the API call
      AuditService.logApiCall(req, action, resource, {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        response_status: res.statusCode,
        success: data?.success || res.statusCode < 400
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { auditLogger };
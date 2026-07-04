const db = require('../services/DatabaseService');

class UsageRateLimiter {
  
  // Check email usage limits
  static async checkEmailLimit(tenantId) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get tenant limits
      const limitsQuery = 'SELECT emails_per_month FROM tenant_usage_limits WHERE tenant_id = $1';
      const limitsResult = await db.query(limitsQuery, [tenantId]);
      
      const emailLimit = limitsResult.rows[0]?.emails_per_month || 50000;
      
      // Get current usage
      const usageQuery = 'SELECT emails_sent FROM tenant_usage_tracking WHERE tenant_id = $1 AND month_year = $2';
      const usageResult = await db.query(usageQuery, [tenantId, currentMonth]);
      
      const currentUsage = usageResult.rows[0]?.emails_sent || 0;
      
      return {
        allowed: currentUsage < emailLimit,
        currentUsage,
        limit: emailLimit,
        remaining: Math.max(0, emailLimit - currentUsage)
      };
    } catch (error) {
      console.error('Error checking email limit:', error);
      return { allowed: true, currentUsage: 0, limit: 50000, remaining: 50000 };
    }
  }
  
  // Increment email usage
  static async incrementEmailUsage(tenantId, count = 1) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const query = `
        INSERT INTO tenant_usage_tracking (tenant_id, month_year, emails_sent)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, month_year)
        DO UPDATE SET 
          emails_sent = tenant_usage_tracking.emails_sent + $3,
          last_updated = NOW()
      `;
      
      await db.query(query, [tenantId, currentMonth, count]);
    } catch (error) {
      console.error('Error incrementing email usage:', error);
    }
  }
  
  // Check API rate limits
  static async checkAPILimit(tenantId, endpoint) {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(Math.floor(windowStart.getMinutes() / 15) * 15, 0, 0); // 15-minute windows
      
      // Get tenant API limits
      const limitsQuery = 'SELECT api_calls_per_minute FROM tenant_usage_limits WHERE tenant_id = $1';
      const limitsResult = await db.query(limitsQuery, [tenantId]);
      
      const apiLimit = (limitsResult.rows[0]?.api_calls_per_minute || 100) * 15; // 15-minute window
      
      // Get current window usage
      const usageQuery = `
        SELECT requests_count FROM api_rate_limits 
        WHERE tenant_id = $1 AND endpoint = $2 AND window_start = $3
      `;
      const usageResult = await db.query(usageQuery, [tenantId, endpoint, windowStart]);
      
      const currentUsage = usageResult.rows[0]?.requests_count || 0;
      
      return {
        allowed: currentUsage < apiLimit,
        currentUsage,
        limit: apiLimit,
        remaining: Math.max(0, apiLimit - currentUsage),
        windowStart
      };
    } catch (error) {
      console.error('Error checking API limit:', error);
      return { allowed: true, currentUsage: 0, limit: 1500, remaining: 1500 };
    }
  }
  
  // Increment API usage
  static async incrementAPIUsage(tenantId, endpoint, windowStart) {
    try {
      const query = `
        INSERT INTO api_rate_limits (tenant_id, endpoint, requests_count, window_start)
        VALUES ($1, $2, 1, $3)
        ON CONFLICT (tenant_id, endpoint, window_start)
        DO UPDATE SET requests_count = api_rate_limits.requests_count + 1
      `;
      
      await db.query(query, [tenantId, endpoint, windowStart]);
    } catch (error) {
      console.error('Error incrementing API usage:', error);
    }
  }
}

// Middleware for email usage checking
const checkEmailUsage = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenant_id || req.tenant?.id;
    
    if (!tenantId) {
      return next();
    }
    
    const usage = await UsageRateLimiter.checkEmailLimit(tenantId);
    
    if (!usage.allowed) {
      return res.status(429).json({
        error: 'Email limit exceeded',
        usage: {
          current: usage.currentUsage,
          limit: usage.limit,
          remaining: usage.remaining
        }
      });
    }
    
    req.emailUsage = usage;
    next();
  } catch (error) {
    console.error('Email usage check error:', error);
    next();
  }
};

// Middleware for API rate limiting
const checkAPIUsage = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenant_id || req.tenant?.id;
    const endpoint = req.route?.path || req.path;
    
    if (!tenantId) {
      return next();
    }
    
    const usage = await UsageRateLimiter.checkAPILimit(tenantId, endpoint);
    
    if (!usage.allowed) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        usage: {
          current: usage.currentUsage,
          limit: usage.limit,
          remaining: usage.remaining
        }
      });
    }
    
    // Increment usage
    await UsageRateLimiter.incrementAPIUsage(tenantId, endpoint, usage.windowStart);
    
    req.apiUsage = usage;
    next();
  } catch (error) {
    console.error('API usage check error:', error);
    next();
  }
};

module.exports = {
  UsageRateLimiter,
  checkEmailUsage,
  checkAPIUsage
};
const requestCounts = new Map();

const rateLimitMiddleware = (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const tenantId = req.user?.tenant_id || 'anonymous';
    const key = `${tenantId}:${userId}`;
    const LIMIT = 100;
    const WINDOW = 15 * 60 * 1000;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, resetTime: now + WINDOW });
    }
    const record = requestCounts.get(key);
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + WINDOW;
    }
    record.count++;
    if (record.count > LIMIT) {
      return res.status(429).json({ error: 'Too Many Requests', message: `Rate limit exceeded. Max ${LIMIT} requests per 15 minutes`, retryAfter: Math.ceil((record.resetTime - now) / 1000) });
    }
    res.set('X-RateLimit-Limit', LIMIT);
    res.set('X-RateLimit-Remaining', LIMIT - record.count);
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next();
  }
};

module.exports = rateLimitMiddleware;

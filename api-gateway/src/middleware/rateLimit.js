const { createClient } = require('redis');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

// Redis client
const redisClient = createClient({
  socket: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT) || 6379 },
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.connect().catch(err => console.error('Rate limit Redis connect error:', err.message));

// Default tier limits (fallback if DB unavailable)
const DEFAULT_TIERS = {
  free:       { requests_per_minute: 30,  requests_per_hour: 500 },
  pro:        { requests_per_minute: 120, requests_per_hour: 5000 },
  enterprise: { requests_per_minute: 600, requests_per_hour: 50000 }
};

// Cache tier limits for 5 minutes to avoid DB hit on every request
const tierCache = new Map();

async function getTierLimits(tenantId, saasId) {
  const cacheKey = `${tenantId}:${saasId}`;
  const cached = tierCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.limits;

  try {
    // Check SaaS override first
    if (saasId) {
      const override = await pool.query(
        `SELECT requests_per_minute, requests_per_hour FROM saas_rate_overrides WHERE saas_id = $1 AND is_active = true`,
        [saasId]
      );
      if (override.rows.length > 0) {
        const limits = override.rows[0];
        tierCache.set(cacheKey, { limits, expiresAt: Date.now() + 300000 });
        return limits;
      }
    }

    // Fall back to tenant tier
    const result = await pool.query(
      `SELECT rlt.requests_per_minute, rlt.requests_per_hour
       FROM tenant_companies tc
       JOIN rate_limit_tiers rlt ON rlt.tier_name = COALESCE(tc.plan_type, 'free')
       WHERE tc.id = $1`,
      [tenantId]
    );

    const limits = result.rows[0] || DEFAULT_TIERS.free;
    tierCache.set(cacheKey, { limits, expiresAt: Date.now() + 300000 });
    return limits;
  } catch {
    return DEFAULT_TIERS.free;
  }
}

// Sliding window rate limiter using Redis
async function checkRateLimit(key, limit, windowSeconds) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    const multi = redisClient.multi();
    multi.zRemRangeByScore(key, '-inf', windowStart);
    multi.zAdd(key, { score: now, value: `${now}` });
    multi.zCard(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();

    const count = results[2];
    return { allowed: count <= limit, count, limit, resetAt: Math.ceil((now + windowSeconds * 1000) / 1000) };
  } catch {
    // Fail open if Redis unavailable
    return { allowed: true, count: 0, limit, resetAt: 0 };
  }
}

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenant_id;
    const saasId = req.user?.saas_id;
    const identifier = tenantId || req.ip;

    const limits = tenantId ? await getTierLimits(tenantId, saasId) : DEFAULT_TIERS.free;

    // Check per-minute limit
    const minuteResult = await checkRateLimit(`rl:min:${identifier}`, limits.requests_per_minute, 60);
    if (!minuteResult.allowed) {
      res.set('X-RateLimit-Limit', minuteResult.limit);
      res.set('X-RateLimit-Remaining', 0);
      res.set('Retry-After', 60);
      return res.status(429).json({ error: 'Rate limit exceeded', window: 'per_minute', limit: minuteResult.limit });
    }

    // Check per-hour limit
    const hourResult = await checkRateLimit(`rl:hr:${identifier}`, limits.requests_per_hour, 3600);
    if (!hourResult.allowed) {
      res.set('X-RateLimit-Limit', hourResult.limit);
      res.set('X-RateLimit-Remaining', 0);
      res.set('Retry-After', 3600);
      return res.status(429).json({ error: 'Rate limit exceeded', window: 'per_hour', limit: hourResult.limit });
    }

    res.set('X-RateLimit-Limit', minuteResult.limit);
    res.set('X-RateLimit-Remaining', Math.max(0, minuteResult.limit - minuteResult.count));
    res.set('X-RateLimit-Reset', minuteResult.resetAt);
    next();
  } catch (error) {
    console.error('Rate limit error:', error.message);
    next(); // Fail open
  }
};

module.exports = rateLimitMiddleware;

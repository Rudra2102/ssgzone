const { Pool } = require('pg');
const { createClient } = require('redis');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const redis = createClient({
  socket: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT) || 6379 },
  password: process.env.REDIS_PASSWORD || undefined
});
redis.connect().catch(err => console.error('Permissions Redis error:', err.message));

// Get effective permissions for a user (cascading: saas → tenant → user overrides)
async function getEffectivePermissions(saasId, tenantId, userId) {
  const cacheKey = `perms:${saasId}:${tenantId}:${userId || 'none'}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  try {
    const saasPerms = await pool.query(
      `SELECT feature_key, is_enabled FROM saas_feature_permissions WHERE saas_id = $1`,
      [saasId]
    );

    const permissions = {};
    saasPerms.rows.forEach(r => { permissions[r.feature_key] = r.is_enabled; });

    if (tenantId) {
      const tenantPerms = await pool.query(
        `SELECT feature_key, is_enabled FROM tenant_feature_permissions WHERE tenant_id = $1`,
        [tenantId]
      );
      tenantPerms.rows.forEach(r => {
        if (permissions[r.feature_key] === true) {
          permissions[r.feature_key] = r.is_enabled;
        }
      });
    }

    if (userId) {
      const userPerms = await pool.query(
        `SELECT feature_key, is_enabled FROM user_feature_permissions WHERE user_id = $1`,
        [userId]
      );
      userPerms.rows.forEach(r => {
        if (permissions[r.feature_key] === true) {
          permissions[r.feature_key] = r.is_enabled;
        }
      });
    }

    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(permissions));
    } catch {}

    return permissions;
  } catch (err) {
    console.error('getEffectivePermissions error:', err.message);
    return {};
  }
}

// Middleware factory: requireFeature('email')
function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const { saas_id, tenant_id, id: userId } = req.user || {};
      if (!saas_id) return next(); // skip for super_admin

      const perms = await getEffectivePermissions(saas_id, tenant_id, userId);
      if (perms[featureKey] === false) {
        return res.status(403).json({ error: 'Feature not enabled for your plan', feature: featureKey });
      }
      next();
    } catch {
      next();
    }
  };
}

async function invalidatePermissionCache(saasId, tenantId, userId) {
  try {
    const pattern = `perms:${saasId || '*'}:${tenantId || '*'}:${userId || '*'}`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  } catch {}
}

module.exports = { getEffectivePermissions, requireFeature, invalidatePermissionCache };

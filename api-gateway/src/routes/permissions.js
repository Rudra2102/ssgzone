const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { invalidatePermissionCache } = require('../middleware/permissions');

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

function authAs(type) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token required' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
      if (decoded.type !== type) return res.status(403).json({ error: `${type} access required` });
      req.decoded = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// GET /api/v1/permissions/features
router.get('/features', async (req, res) => {
  const result = await pool.query('SELECT * FROM feature_definitions ORDER BY category, feature_key');
  res.json({ success: true, data: result.rows });
});

// GET /api/v1/permissions/saas/:saasId
router.get('/saas/:saasId', authAs('super_admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT fd.feature_key, fd.feature_name, fd.category,
            COALESCE(sfp.is_enabled, false) as is_enabled
     FROM feature_definitions fd
     LEFT JOIN saas_feature_permissions sfp ON sfp.feature_key = fd.feature_key AND sfp.saas_id = $1
     ORDER BY fd.category, fd.feature_key`,
    [req.params.saasId]
  );
  res.json({ success: true, data: result.rows });
});

// PUT /api/v1/permissions/saas/:saasId
router.put('/saas/:saasId', authAs('super_admin'), async (req, res) => {
  const { permissions } = req.body;
  const saasId = parseInt(req.params.saasId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [feature_key, is_enabled] of Object.entries(permissions)) {
      await client.query(
        `INSERT INTO saas_feature_permissions (saas_id, feature_key, is_enabled, assigned_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (saas_id, feature_key) DO UPDATE SET is_enabled = $3, assigned_by = $4`,
        [saasId, feature_key, is_enabled, req.decoded.adminId]
      );
    }
    await client.query('COMMIT');
    await invalidatePermissionCache(saasId, null, null);
    res.json({ success: true, message: 'SaaS permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/v1/permissions/tenant/:tenantId
router.get('/tenant/:tenantId', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token required' });
  const result = await pool.query(
    `SELECT fd.feature_key, fd.feature_name, fd.category,
            COALESCE(sfp.is_enabled, false) as saas_enabled,
            COALESCE(tfp.is_enabled, sfp.is_enabled, false) as is_enabled
     FROM feature_definitions fd
     JOIN tenant_companies tc ON tc.id = $1
     LEFT JOIN saas_feature_permissions sfp ON sfp.feature_key = fd.feature_key AND sfp.saas_id = tc.saas_app_id
     LEFT JOIN tenant_feature_permissions tfp ON tfp.feature_key = fd.feature_key AND tfp.tenant_id = $1
     ORDER BY fd.category, fd.feature_key`,
    [req.params.tenantId]
  );
  res.json({ success: true, data: result.rows });
});

// PUT /api/v1/permissions/tenant/:tenantId
router.put('/tenant/:tenantId', authAs('saas_admin'), async (req, res) => {
  const { permissions } = req.body;
  const tenantId = req.params.tenantId; // UUID

  const tenantRow = await pool.query('SELECT saas_app_id FROM tenant_companies WHERE id = $1', [tenantId]);
  if (!tenantRow.rows.length) return res.status(404).json({ error: 'Tenant not found' });
  const saasId = tenantRow.rows[0].saas_app_id;

  const saasPerms = await pool.query(
    'SELECT feature_key, is_enabled FROM saas_feature_permissions WHERE saas_id = $1',
    [saasId]
  );
  const saasMap = {};
  saasPerms.rows.forEach(r => { saasMap[r.feature_key] = r.is_enabled; });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [feature_key, is_enabled] of Object.entries(permissions)) {
      const effective = is_enabled && (saasMap[feature_key] !== false);
      await client.query(
        `INSERT INTO tenant_feature_permissions (tenant_id, feature_key, is_enabled, assigned_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, feature_key) DO UPDATE SET is_enabled = $3, assigned_by = $4`,
        [tenantId, feature_key, effective, req.decoded.adminId]
      );
    }
    await client.query('COMMIT');
    await invalidatePermissionCache(saasId, tenantId, null);
    res.json({ success: true, message: 'Tenant permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/v1/permissions/user/:userId
router.put('/user/:userId', authAs('tenant_admin'), async (req, res) => {
  const { permissions } = req.body;
  const userId = req.params.userId; // UUID

  const userRow = await pool.query(
    'SELECT tu.tenant_id, tc.saas_app_id FROM tenant_users tu JOIN tenant_companies tc ON tc.id = tu.tenant_id WHERE tu.id = $1',
    [userId]
  );
  if (!userRow.rows.length) return res.status(404).json({ error: 'User not found' });
  const { tenant_id, saas_app_id } = userRow.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [feature_key, is_enabled] of Object.entries(permissions)) {
      await client.query(
        `INSERT INTO user_feature_permissions (user_id, feature_key, is_enabled, assigned_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, feature_key) DO UPDATE SET is_enabled = $3, assigned_by = $4`,
        [userId, feature_key, is_enabled, req.decoded.id]
      );
    }
    await client.query('COMMIT');
    await invalidatePermissionCache(saas_app_id, tenant_id, userId);
    res.json({ success: true, message: 'User permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/v1/permissions/effective
router.get('/effective', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    const { getEffectivePermissions } = require('../middleware/permissions');
    const perms = await getEffectivePermissions(decoded.saas_id, decoded.tenant_id, decoded.id);
    res.json({ success: true, data: perms });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
